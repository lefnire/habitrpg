'use strict';

describe('Settings Controller', function () {
  var rootScope, scope, $httpBackend, user, User, ctrl, Notification;

  const actionClickEvent = {
    target: document.createElement('button'),
  };

  beforeEach(function () {
    module(function($provide) {
      user = specHelper.newUser();
      User = {
        set: sandbox.stub(),
        reroll: sandbox.stub(),
        rebirth: sandbox.stub(),
        releasePets: sandbox.stub(),
        releaseMounts: sandbox.stub(),
        releaseBoth: sandbox.stub(),
        setCustomDayStart: sandbox.stub(),
        restore: sandbox.stub(),
        user: user
      };

      User.user.ops = {
        reroll: sandbox.stub(),
        rebirth: sandbox.stub(),
        releasePets: sandbox.stub(),
        releaseMounts: sandbox.stub(),
        releaseBoth: sandbox.stub(),
        restore: sandbox.stub(),
      };

      Notification = {
        error: sandbox.stub(),
        text: sandbox.stub()
      };

      $provide.value('Notification', Notification);
      $provide.value('User', User);
      $provide.value('Guide', sandbox.stub());
    });

    inject(function(_$rootScope_, _$controller_, _$httpBackend_) {
      scope = _$rootScope_.$new();
      rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;

      $httpBackend.whenGET(/partials/).respond();

      // Load RootCtrl to ensure shared behaviors are loaded
      _$controller_('RootCtrl',  {$scope: scope, User: User, Notification: Notification});

      ctrl = _$controller_('SettingsCtrl', {$scope: scope, User: User, Notification: Notification});
    });
  });

  describe('#openDayStartModal', function () {
    beforeEach(function () {
      sandbox.stub(rootScope, 'openModal');
      sandbox.stub(window, 'alert');
    });

    it('opens the day start modal', function () {
      scope.openDayStartModal(5);

      expect(rootScope.openModal).to.be.calledOnce;
      expect(rootScope.openModal).to.be.calledWith('change-day-start', {scope: scope});
    });

    it('sets nextCron variable', function () {
      expect(scope.nextCron).to.not.exist;

      scope.openDayStartModal(5);

      expect(scope.nextCron).to.exist;
    });

    it('calculates the next time cron will run', function () {
      var fakeCurrentTime = new Date(2013, 3, 1, 3, 12).getTime();
      var expectedTime = new Date(2013, 3, 1, 5, 0, 0).getTime();
      sandbox.useFakeTimers(fakeCurrentTime);

      scope.openDayStartModal(5);

      expect(scope.nextCron).to.eq(expectedTime);
    });

    it('calculates the next time cron will run and adds a day if cron would have already passed', function () {
      var fakeCurrentTime = new Date(2013, 3, 1, 8, 12).getTime();
      var expectedTime = new Date(2013, 3, 2, 5, 0, 0).getTime();
      sandbox.useFakeTimers(fakeCurrentTime);

      scope.openDayStartModal(5);

      expect(scope.nextCron).to.eq(expectedTime);
    });
  });

  describe('#saveDayStart', function () {
    it('updates user\'s custom day start', function () {
      scope.dayStart = 5;
      scope.saveDayStart();

      expect(User.setCustomDayStart).to.be.calledWith(5);
    });
  });

  context('Player Reroll', function () {
    describe('#reroll', function () {
      beforeEach(function () {
        scope.clickReroll(actionClickEvent);
      });

      it('destroys the previous popover if it exists', function () {
        sandbox.spy($.fn, 'popover');

        scope.reroll(false);

        expect(scope.popoverEl).to.exist;
        expect($.fn.popover).to.be.calledWith('destroy');
      });

      it('doesn\'t call reroll when not confirmed', function () {
        scope.reroll(false);

        expect(user.ops.reroll).to.not.be.calledOnce;
      });

      it('calls reroll on the user when confirmed', function () {
        sandbox.stub(rootScope.$state, 'go');

        scope.reroll(true);

        expect(User.reroll).to.be.calledWith({});
      });

      it('navigates to the tasks page when confirmed', function () {
        sandbox.stub(rootScope.$state, 'go');

        scope.reroll(true);

        expect(rootScope.$state.go).to.be.calledWith('tasks');
      });
    });

    describe('#clickReroll', function () {
      it('displays a confirmation popover for the user', function () {
        sandbox.spy($.fn, 'popover');

        scope.clickReroll(actionClickEvent);

        expect($.fn.popover).to.be.calledWith('destroy');
        expect($.fn.popover).to.be.calledWith('show');
      });
    });
  });

  context('Player Rebirth', function () {
    describe('#rebirth', function () {
      beforeEach(function () {
        scope.clickRebirth(actionClickEvent);
      });

      it('destroys the previous popover if it exists', function () {
        sandbox.spy($.fn, 'popover');

        scope.rebirth(false);

        expect(scope.popoverEl).to.exist;
        expect($.fn.popover).to.be.calledWith('destroy');
      });

      it('doesn\'t call rebirth when not confirmed', function () {
        scope.rebirth(false);

        expect(user.ops.rebirth).to.not.be.calledOnce;
      });

      it('calls rebirth on the user when confirmed', function () {
        sandbox.stub(rootScope.$state, 'go');

        scope.rebirth(true);

        expect(User.rebirth).to.be.calledWith({});
      });

      it('navigates to tasks page when confirmed', function () {
        sandbox.stub(rootScope.$state, 'go');

        scope.rebirth(true);

        expect(rootScope.$state.go).to.be.calledWith('tasks');
      });
    });

    describe('#clickRebirth', function () {
      it('displays a confirmation popover for the user', function () {
        sandbox.spy($.fn, 'popover');

        scope.clickRebirth(actionClickEvent);

        expect($.fn.popover).to.be.calledWith('destroy');
        expect($.fn.popover).to.be.calledWith('show');
      });
    });
  })

  context('Releasing pets and mounts', function () {
    describe('#release', function () {
      beforeEach(function () {
        scope.clickRelease('dummy', actionClickEvent);

        sandbox.stub(rootScope.$state, 'go');
      });

      it('destroys the previous popover if it exists', function () {
        sandbox.spy($.fn, 'popover');

        scope.releaseAnimals('', false);

        expect($.fn.popover).to.be.calledWith('destroy');
      });

      it('doesn\'t call any release method if type is not provided', function () {
        scope.releaseAnimals();

        expect(User.releasePets).to.not.be.called;
        expect(User.releaseMounts).to.not.be.called;
        expect(User.releaseBoth).to.not.be.called;
      });

      it('doesn\'t redirect to tasks page if type is not provided', function () {
        scope.releaseAnimals();

        expect(rootScope.$state.go).to.not.be.called;
      })

      it('calls releasePets when "pets" is provided', function () {
        scope.releaseAnimals('pets');

        expect(User.releasePets).to.be.calledOnce;
      });

      it('navigates to the tasks page when "pets" is provided', function () {
        scope.releaseAnimals('pets');

        expect(rootScope.$state.go).to.be.calledOnce;
      });

      it('calls releaseMounts when "mounts" is provided', function () {
        scope.releaseAnimals('mounts');

        expect(User.releaseMounts).to.be.calledOnce;
      });

      it('navigates to the tasks page when "mounts" is provided', function () {
        scope.releaseAnimals('mounts');

        expect(rootScope.$state.go).to.be.calledOnce;
      });

      it('calls releaseBoth when "both" is provided', function () {
        scope.releaseAnimals('both');

        expect(User.releaseBoth).to.be.calledOnce;
      });

      it('navigates to the tasks page when "both" is provided', function () {
        scope.releaseAnimals('both');

        expect(rootScope.$state.go).to.be.calledOnce;
      });

      it('does not call release functions when non-applicable argument is passed in', function () {
        scope.releaseAnimals('dummy');

        expect(User.releasePets).to.not.be.called;
        expect(User.releaseMounts).to.not.be.called;
        expect(User.releaseBoth).to.not.be.called;
      });
    });

    describe('#clickRelease', function () {
      it('displays a confirmation popover for the user', function () {
        sandbox.spy($.fn, 'popover');
        scope.clickRelease('dummy', actionClickEvent);

        expect($.fn.popover).to.be.calledWith('destroy');
        expect($.fn.popover).to.be.called;
        expect($.fn.popover).to.be.calledWith('show');
      });
    });
  });

  context('Validating coupons', function () {
    describe('#applyCoupon', function () {
      it('displays an error when an invalid coupon is applied', function () {
        $httpBackend
          .whenPOST('/api/v3/coupons/validate/INVALID_COUPON?userV=undefined')
          .respond(200, {
            success: true,
            data: {
              valid: false
            },
            notifications: [],
            userV: 'undefined'
          });

        scope.applyCoupon('INVALID_COUPON');

        $httpBackend.flush();

        expect(Notification.error).to.be.called;
        expect(Notification.error).to.be.calledWith(env.t('invalidCoupon'), true);
      });

      it('displays an confirmation when a valid coupon is applied', function () {
        $httpBackend
          .whenPOST('/api/v3/coupons/validate/VALID_COUPON?userV=undefined')
          .respond(200, {
            success: true,
            data: {
              valid: true
            },
            notifications: [],
            userV: 'undefined'
          });

        scope.applyCoupon('VALID_COUPON');

        $httpBackend.flush();

        expect(Notification.error).to.not.be.called;
        expect(Notification.text).to.be.calledWith('Coupon applied!');
      });
    });
  });

  context('Fixing character values', function () {
    describe('#restore', function () {
      it('doesn\'t update character values when level is less than 1', function () {
        scope.restoreValues = {
          stats: {
            hp: 0,
            exp: 0,
            gp: 0,
            lvl: 0,
            mp: 0,
          },
          achievements: {
            streak: 0,
          },
        };
        scope.restore();
        expect(User.set).to.not.be.called;
      });

      it('updates character values when level is at least 1', function () {
        scope.restoreValues = {
          stats: {
            hp: 0,
            exp: 0,
            gp: 0,
            lvl: 1,
            mp: 0,
          },
          achievements: {
            streak: 0,
          },
        };
        scope.restore();
        expect(User.set).to.be.called;
      });
    });
  });
});
