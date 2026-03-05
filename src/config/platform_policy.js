export const VALID_PLATFORM = {
  421: "android",
  1: "web",
};

export const PLATFORM_POLICY = {
  [VALID_PLATFORM[421]]: {
    refreshTtlDays: 60,
    slideThresholdDays: 7,
    rotateAlways: false,
    refreshTokenSource: "json",
  },
  [VALID_PLATFORM[1]]: {
    refreshTtlDays: 14,
    slideThresholdDays: 14,
    rotateAlways: true,
    refreshTokenSource: "cookie",
  },
};
