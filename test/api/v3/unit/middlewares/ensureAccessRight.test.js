/* eslint-disable global-require */
import {
  generateRes,
  generateReq,
  generateNext,
} from '../../../../helpers/api-unit.helper';
import i18n from '../../../../../website/common/script/i18n';
import { ensureAdmin, ensureSudo } from '../../../../../website/server/middlewares/ensureAccessRight';
import { Forbidden } from '../../../../../website/server/libs/errors';

describe('ensure access middlewares', () => {
  let res, req, next;

  beforeEach(() => {
    res = generateRes();
    req = generateReq();
    next = generateNext();
  });

  context('ensure admin', () => {
    it('returns forbidden when user is not an admin', () => {
      res.locals = {user: {contributor: {admin: false}}};

      ensureAdmin(req, res, next);

      expect(next).to.be.calledWith(new Forbidden(i18n.t('noAdminAccess')));
    });

    it('passes when user is an admin', () => {
      res.locals = {user: {contributor: {admin: true}}};

      ensureAdmin(req, res, next);

      expect(next).to.be.calledOnce;
      expect(next.args[0]).to.be.empty;
    });
  });

  context('ensure sudo', () => {
    it('returns forbidden when user is not a sudo user', () => {
      res.locals = {user: {contributor: {sudo: false}}};

      ensureSudo(req, res, next);

      expect(next).to.be.calledWith(new Forbidden(i18n.t('noSudoAccess')));
    });

    it('passes when user is a sudo user', () => {
      res.locals = {user: {contributor: {sudo: true}}};

      ensureSudo(req, res, next);

      expect(next).to.be.calledOnce;
      expect(next.args[0]).to.be.empty;
    });
  });
});
