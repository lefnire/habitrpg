import monk from 'monk';
import nconf from 'nconf';
import stripePayments from '../../website/server/libs/payments/stripe';

/*
 * Ensure that group plan billing is accurate by doing the following:
 * 1. Correct the memberCount in all paid groups whose counts are wrong
 * 2. Where the above uses Stripe, update their subscription counts in Stripe
 *
 * Provides output on what groups were fixed, which can be piped to CSV.
 */

const CONNECTION_STRING = nconf.get('MIGRATION_CONNECT_STRING');

let dbGroups = monk(CONNECTION_STRING).get('groups', { castIds: false });
let dbUsers = monk(CONNECTION_STRING).get('users', { castIds: false });

function fixGroupPlanMembers () {
  console.info('Group ID,Customer ID,Plan ID,Quantity,Recorded Member Count,Actual Member Count');
  let groupPlanCount = 0;
  let fixedGroupCount = 0;
  dbGroups.find(
    {
      $and:
        [
          {'purchased.plan.planId': {$ne: null}},
          {'purchased.plan.planId': {$ne: ''}},
          {'purchased.plan.customerId': {$ne: 'cus_9f0DV4g7WHRzpM'}}, // Demo groups
          {'purchased.plan.customerId': {$ne: 'cus_9maalqDOFTrvqx'}},
        ],
      $or:
        [
          {'purchased.plan.dateTerminated': null},
          {'purchased.plan.dateTerminated': ''},
        ],
    },
    {
      fields: {
        memberCount: 1,
        'purchased.plan': 1,
      },
    }
  ).each(async (group, {close, pause, resume}) => { // eslint-disable-line no-unused-vars
    pause();
    groupPlanCount++;
    const canonicalMemberCount = await dbUsers.count(
      {
        $or:
          [
            {'party._id': group._id},
            {guilds: group._id},
          ],
      }
    );
    const incorrectMemberCount = group.memberCount !== canonicalMemberCount;

    const isMonthlyPlan = group.purchased.plan.planId === 'group_monthly';
    const quantityMismatch = group.purchased.plan.quantity !== group.memberCount + 2;
    const incorrectQuantity = isMonthlyPlan && quantityMismatch;

    if (incorrectMemberCount || incorrectQuantity) {
      console.info(`${group._id},${group.purchased.plan.customerId},${group.purchased.plan.planId},${group.purchased.plan.quantity},${group.memberCount},${canonicalMemberCount}`);
      return dbGroups.update(
        {_id: group._id},
        {$set: {memberCount: canonicalMemberCount}}
      ).then(async () => {
        fixedGroupCount++;
        if (group.purchased.plan.paymentMethod === 'Stripe') {
          await stripePayments.chargeForAdditionalGroupMember(group);
        } else if (incorrectQuantity) {
          return dbGroups.update(
            {_id: group._id},
            {$set: {'purchased.plan.quantity': canonicalMemberCount + 2}}
          ).then(() => {
            resume();
          });
        } else {
          resume();
        }
      }).catch((err) => {
        console.log(err);
        return process.exit(1);
      });
    } else {
      resume();
    }
  }).then(() => {
    console.info(`Fixed ${fixedGroupCount} out of ${groupPlanCount} active Group Plans`);
    return process.exit(0);
  });
}

module.exports = fixGroupPlanMembers;
