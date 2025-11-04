import { useReducer, useCallback, Dispatch } from "react";
import { ChartEdit } from "@falling-nikochan/chart";

// Action types for chart state management
export type ChartAction =
  | { type: "SET_CHART"; payload: ChartEdit }
  | { type: "UPDATE_CHART"; payload: ChartEdit }
  | { type: "SET_HAS_CHANGE"; payload: boolean };

export interface ChartState {
  chart?: ChartEdit;
  hasChange: boolean;
}

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case "SET_CHART":
      // Used when loading a chart (don't set hasChange)
      return {
        chart: action.payload,
        hasChange: false,
      };
    case "UPDATE_CHART":
      // Used when modifying a chart (sets hasChange to true)
      return {
        chart: action.payload,
        hasChange: true,
      };
    case "SET_HAS_CHANGE":
      return {
        ...state,
        hasChange: action.payload,
      };
    default:
      return state;
  }
}

export interface UseChartStateReturn {
  chart?: ChartEdit;
  hasChange: boolean;
  setChart: (chart: ChartEdit) => void;
  changeChart: (chart: ChartEdit) => void;
  setHasChange: (hasChange: boolean) => void;
  dispatch: Dispatch<ChartAction>;
}

export function useChartState(initialChart?: ChartEdit): UseChartStateReturn {
  const [state, dispatch] = useReducer(chartReducer, {
    chart: initialChart,
    hasChange: false,
  });

  const setChart = useCallback((chart: ChartEdit) => {
    dispatch({ type: "SET_CHART", payload: chart });
  }, []);

  const changeChart = useCallback((chart: ChartEdit) => {
    dispatch({ type: "UPDATE_CHART", payload: chart });
  }, []);

  const setHasChange = useCallback((hasChange: boolean) => {
    dispatch({ type: "SET_HAS_CHANGE", payload: hasChange });
  }, []);

  return {
    chart: state.chart,
    hasChange: state.hasChange,
    setChart,
    changeChart,
    setHasChange,
    dispatch,
  };
}
