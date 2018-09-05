import { message } from "antd";
import {
  getAllSelectors,
  getAllRules,
  addSelector,
  findSelector,
  getAllPlugins
} from "../services/api";

export default {
  namespace: "waf",

  state: {
    selectorList: [],
    ruleList: [],
    selectorTotal: 0,
    ruleTotal: 0,
    currentSelector: "",
    plugins: []
  },

  effects: {
    *fetchSelector({ payload }, { call, put }) {
      const res = yield call(getAllPlugins, {
        currentPage: 1,
        pageSize: 50
      });
      if (res.code === 200) {
        let plugins = res.data.dataList;
        yield put({
          type: "savePlugins",
          payload: {
            dataList: plugins
          }
        });
        const plugin = plugins.filter(item => {
          return item.name === "waf";
        });
        let pluginId = "";
        if (plugin && plugin.length > 0) {
          pluginId = plugin[0].id;
        }
        const json = yield call(getAllSelectors, { ...payload, pluginId });
        if (json.code === 200) {
          let { page, dataList } = json.data;
          dataList = dataList.map(item => {
            item.key = item.id;
            return item;
          });
          yield put({
            type: "saveSelector",
            payload: {
              selectorTotal: page.totalCount,
              selectorList: dataList
            }
          });

          if (dataList && dataList.length > 0) {
            yield put({
              type: "saveCurrentSelector",
              payload: {
                currentSelector: dataList[0]
              }
            });

            yield put({
              type: "fetchRule",
              payload: {
                currentPage: 1,
                pageSize: 12,
                selectorId: dataList[0].id
              }
            });
          }
        }
      }
    },
    *fetchRule({ payload }, { call, put }) {
      const json = yield call(getAllRules, payload);
      if (json.code === 200) {
        let { page, dataList } = json.data;
        dataList = dataList.map(item => {
          item.key = item.id;
          return item;
        });
        yield put({
          type: "saveRule",
          payload: {
            ruleTotal: page.totalCount,
            ruleList: dataList
          }
        });
      }
    },
    *addSelector(params, { call, put }) {
      const { payload, callback, fetchValue } = params;
      const json = yield call(addSelector, payload);
      if (json.code === 200) {
        message.success("添加成功");
        callback();
        yield put({ type: "reload", fetchValue });
      } else {
        message.warn(json.message);
      }
    },

    *fetchSeItem(params, { call }) {
      const { payload, callback } = params;
      const json = yield call(findSelector, payload);
      if (json.code === 200) {
        const selector = json.data;
        callback(selector);
      }
    },

    *reload(params, { put }) {
      const { fetchValue } = params;
      const { pluginId, currentPage, pageSize } = fetchValue;
      const payload = { pluginId, currentPage, pageSize };
      yield put({ type: "fetchSelector", payload });
    }
  },

  reducers: {
    saveSelector(state, { payload }) {
      return {
        ...state,
        selectorList: payload.selectorList,
        selectorTotal: payload.selectorTotal
      };
    },

    saveRule(state, { payload }) {
      return {
        ...state,
        ruleList: payload.ruleList,
        ruleTotal: payload.ruleTotal
      };
    },

    savePlugins(state, { payload }) {
      return {
        ...state,
        plugins: payload.dataList
      };
    },
    saveCurrentSelector(state, { payload }) {
      return {
        ...state,
        currentSelector: payload.currentSelector
      };
    }
  }
};