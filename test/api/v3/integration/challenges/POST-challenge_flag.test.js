import {
  generateChallenge,
  createAndPopulateGroup,
  translate as t,
} from '../../../../helpers/api-v3-integration.helper';
import { v4 as generateUUID } from 'uuid';

describe('POST /challenges/:challengeId/flag', () => {
  let user, challenge;

  beforeEach(async () => {
    let { group, groupLeader } = await createAndPopulateGroup({
      groupDetails: {
        name: 'TestPrivateGuild',
        type: 'guild',
        privacy: 'private',
      },
      members: 1,
    });

    user = groupLeader;

    challenge = await generateChallenge(user, group);
  });

  it('returns an error when challenge is not found', async () => {
    await expect(user.post(`/challenges/${generateUUID()}/flag`))
      .to.eventually.be.rejected.and.eql({
        code: 404,
        error: 'NotFound',
        message: t('challengeNotFound'),
      });
  });

  it('flags a challenge', async () => {
    const flagResult = await user.post(`/challenges/${challenge._id}/flag`);

    expect(flagResult.challenge.flags[user._id]).to.equal(true);
    expect(flagResult.challenge.flagCount).to.equal(1);
  });

  it('flags a challenge with a higher count when from an admin', async () => {
    await user.update({'user.contributor.admin': true});

    const flagResult = await user.post(`/challenges/${challenge._id}/flag`);

    expect(flagResult.challenge.flags[user._id]).to.equal(true);
    expect(flagResult.challenge.flagCount).to.equal(1);
  });

  it('returns an error when user tries to flag a challenge that is already flagged', async () => {
    await user.post(`/challenges/${challenge._id}/flag`);

    await expect(user.post(`/challenges/${challenge._id}/flag`))
      .to.eventually.be.rejected.and.eql({
        code: 404,
        error: 'NotFound',
        message: t('messageGroupChatFlagAlreadyReported'),
      });
  });
});
