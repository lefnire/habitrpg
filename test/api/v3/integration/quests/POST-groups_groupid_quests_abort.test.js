import {
  createAndPopulateGroup,
  translate as t,
  generateUser,
} from '../../../../helpers/api-v3-integration.helper';
import { v4 as generateUUID } from 'uuid';

describe('POST /groups/:groupId/quests/abort', () => {
  let questingGroup;
  let partyMembers;
  let user;
  let leader;

  const PET_QUEST = 'whale';

  beforeEach(async () => {
    let { group, groupLeader, members } = await createAndPopulateGroup({
      groupDetails: { type: 'party', privacy: 'private' },
      members: 2,
    });

    questingGroup = group;
    leader = groupLeader;
    partyMembers = members;

    await leader.update({
      [`items.quests.${PET_QUEST}`]: 1,
    });
    user = await generateUser();
  });

  context('failure conditions', () => {
    it('returns an error when group is not found', async () => {
      await expect(partyMembers[0].post(`/groups/${generateUUID()}/quests/abort`))
        .to.eventually.be.rejected.and.eql({
          code: 404,
          error: 'NotFound',
          message: t('groupNotFound'),
        });
    });

    it('returns an error for a group in which user is not a member', async () => {
      await expect(user.post(`/groups/${questingGroup._id}/quests/abort`))
      .to.eventually.be.rejected.and.eql({
        code: 404,
        error: 'NotFound',
        message: t('groupNotFound'),
      });
    });

    it('returns an error when group is a guild', async () => {
      let { group: guild, groupLeader: guildLeader } = await createAndPopulateGroup({
        groupDetails: { type: 'guild', privacy: 'private' },
      });

      await expect(guildLeader.post(`/groups/${guild._id}/quests/abort`))
      .to.eventually.be.rejected.and.eql({
        code: 403,
        error: 'Forbidden',
        message: t('guildQuestsNotSupported'),
      });
    });

    it('returns an error when quest is not active', async () => {
      await expect(partyMembers[0].post(`/groups/${questingGroup._id}/quests/abort`))
        .to.eventually.be.rejected.and.eql({
          code: 404,
          error: 'NotFound',
          message: t('noActiveQuestToAbort'),
        });
    });

    it('returns an error when non quest leader attempts to abort', async () => {
      await leader.post(`/groups/${questingGroup._id}/quests/invite/${PET_QUEST}`);
      await partyMembers[0].post(`/groups/${questingGroup._id}/quests/accept`);
      await partyMembers[1].post(`/groups/${questingGroup._id}/quests/accept`);

      await expect(partyMembers[0].post(`/groups/${questingGroup._id}/quests/abort`))
        .to.eventually.be.rejected.and.eql({
          code: 403,
          error: 'Forbidden',
          message: t('onlyLeaderAbortQuest'),
        });
    });
  });

  it('aborts a quest', async () => {
    await leader.post(`/groups/${questingGroup._id}/quests/invite/${PET_QUEST}`);
    await partyMembers[0].post(`/groups/${questingGroup._id}/quests/accept`);
    await partyMembers[1].post(`/groups/${questingGroup._id}/quests/accept`);

    let res = await leader.post(`/groups/${questingGroup._id}/quests/abort`);
    await Promise.all([
      leader.sync(),
      questingGroup.sync(),
      partyMembers[0].sync(),
      partyMembers[1].sync(),
    ]);

    let cleanUserQuestObj = {
      key: null,
      progress: {
        up: 0,
        down: 0,
        collect: {},
        collectedItems: 0,
      },
      completed: null,
      RSVPNeeded: false,
    };

    expect(leader.party.quest).to.eql(cleanUserQuestObj);
    expect(partyMembers[0].party.quest).to.eql(cleanUserQuestObj);
    expect(partyMembers[1].party.quest).to.eql(cleanUserQuestObj);
    expect(leader.items.quests[PET_QUEST]).to.equal(1);
    expect(questingGroup.quest).to.deep.equal(res);
    expect(questingGroup.quest).to.eql({
      key: null,
      active: false,
      leader: null,
      progress: {
        collect: {},
      },
      members: {},
    });
  });
});
