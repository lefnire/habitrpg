import Vue from 'vue';
import state from './state';
import * as actions from './actions';
import * as getters from './getters';

// Central application store for Habitica
// Heavily inspired to Vuex (https://github.com/vuejs/vuex) with a
// similar internal implementation (thanks!), main difference is the absence of mutations.

let _vm; // defined below

const store = {
  getters: {},
  get state () {
    return _vm.$data.state;
  },
  actions,
  // Actions should be called using store.dispatch(ACTION, ...ARGS)
  dispatch (type, ...args) {
    let action = actions[type];

    if (!action) throw new Error(`Action "${type}" not found.`);
    return action(store, ...args);
  },
  watch (getter, cb, options) {
    if (typeof getter !== 'function') throw new Error('The first argument of store.watch must be a function.');
    return _vm.$watch(() => getter(state), cb, options);
  },
};

// Setup getters
const _computed = {};

Object.keys(getters).forEach(key => {
  let getter = getters[key];

  _computed[key] = () => getter(store);

  Object.defineProperty(store.getters, key, {
    get: () => _vm[key],
  });
});

// Setup internal Vue instance to make state and getters reactive
_vm = new Vue({
  data: { state },
  computed: _computed,
});

export default store;

// Inject the store into all components
Vue.mixin({
  beforeCreate () {
    this.$store = store;
  },
});

