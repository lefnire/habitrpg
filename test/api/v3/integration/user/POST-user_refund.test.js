/* eslint-disable camelcase */

import {
  generateUser,
  translate as t,
} from '../../../../helpers/api-integration/v3';
import shared from '../../../../../website/common/script';

let content = shared.content;

describe('POST /user/refund/:key', () => {
  let user;

  beforeEach(async () => {
    user = await generateUser({
      'stats.gp': 400,
    });
  });

  // More tests in common code unit tests

  it('returns an error if the item is not found', async () => {
    await expect(user.post('/user/refund/notExisting'))
      .to.eventually.be.rejected.and.eql({
        code: 404,
        error: 'NotFound',
        message: t('itemNotFound', {key: 'notExisting'}),
      });
  });

  xit('refunds a potion', async () => {
    await user.update({
      'stats.gp': 400,
      'stats.hp': 40,
    });

    let potion = content.potion;
    let res = await user.post('/user/refund/potion');
    await user.sync();

    expect(user.stats.hp).to.equal(50);
    expect(res.data).to.eql(user.stats);
    expect(res.message).to.equal(t('messageBought', {itemText: potion.text()}));
  });

  xit('returns an error if user tries to refund a potion with full health', async () => {
    await user.update({
      'stats.gp': 40,
      'stats.hp': 50,
    });

    await expect(user.post('/user/refund/potion'))
      .to.eventually.be.rejected.and.eql({
        code: 401,
        error: 'NotAuthorized',
        message: t('messageHealthAlreadyMax'),
      });
  });

  it('refunds a piece of gear', async () => {
    let key = 'armor_warrior_1';

    await user.post(`/user/buy/${key}`);
    await user.post(`/user/refund/${key}`);
    await user.sync();

    expect(user.items.gear.owned.armor_warrior_1).to.eql(false);
  });
});
