import { shallowMount, createLocalVue } from '@vue/test-utils';
import moment from 'moment';

import Task from '@/components/tasks/task.vue';
import Store from '@/libs/store';

const localVue = createLocalVue();
localVue.use(Store);

describe('Task', () => {
  let wrapper;

  function makeWrapper (additionalTaskData = {}, additionalUserData = {}) {
    return shallowMount(Task, {
      propsData: {
        task: {
          group: {},
          ...additionalTaskData,
        },
      },
      store: {
        state: {
          user: {
            data: {
              preferences: {},
              ...additionalUserData,
            },
          },
        },
        getters: {
          'tasks:getTaskClasses': () => ({}),
          'tasks:canEdit': () => ({}),
          'tasks:canDelete': () => ({}),
        },
      },
      mocks: { $t: (key, params) => key + (params ? JSON.stringify(params) : '') },
      directives: { 'b-tooltip': {} },
      localVue,
    });
  }

  it('returns a vue instance', () => {
    wrapper = makeWrapper();
    expect(wrapper.isVueInstance()).to.be.true;
  });

  describe('Due date calculation', () => {
    let clock;

    function setClockTo (time) {
      const now = moment(time);
      clock = sinon.useFakeTimers(now.toDate());
      return now;
    }

    afterEach(() => {
      clock.restore();
    });

    it('formats due date to today if due today', () => {
      const now = setClockTo('2019-09-17T17:57:00+02:00');
      const date = moment(now);
      wrapper = makeWrapper({ date });

      expect(wrapper.vm.formatDueDate()).to.equal('dueIn{"dueIn":"today"}');
    });

    it('formats due date to tomorrow if due tomorrow', () => {
      setClockTo('2012-06-12T14:17:28Z');
      const date = moment('2012-06-13T14:17:28Z');
      wrapper = makeWrapper({ date });

      expect(wrapper.vm.formatDueDate()).to.equal('dueIn{"dueIn":"in a day"}');
    });

    it('formats due date to 5 days if due in 5 days', () => {
      setClockTo('2019-03-23T08:22:17Z');
      const date = moment('2019-03-28T09:17:28Z');
      wrapper = makeWrapper({ date });

      expect(wrapper.vm.formatDueDate()).to.equal('dueIn{"dueIn":"in 5 days"}');
    });

    it('formats due date to tomorrow if today but before dayStart', () => {
      setClockTo('2019-06-12T04:23:37+07:00');
      const date = moment('2019-06-12:18:27+07:00');
      wrapper = makeWrapper({ date }, { preferences: { dayStart: 7 } });

      expect(wrapper.vm.formatDueDate()).to.equal('dueIn{"dueIn":"in a day"}');
    });

    // This test may be flaky, not sure yet.  If it fails unexpectedly for you,
    // please turn it off by using `xit` i.o. `it` and let https://github.com/benkelaar know.
    it('formats due date to today if due tomorrow before dayStart', () => {
      setClockTo('2017-07-02T20:21:27Z');
      const date = moment('2017-07-03T01:30:02Z');
      wrapper = makeWrapper({ date }, { preferences: { dayStart: 5 } });

      expect(wrapper.vm.formatDueDate()).to.equal('dueIn{"dueIn":"today"}');
    });
  });
});
