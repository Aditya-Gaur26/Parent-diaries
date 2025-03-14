export default {
  expo: {
    scheme: "wavediaries",
    android: {
      intentFilters: [
        {
          action: "VIEW",
          data: {
            scheme: "wavediaries"
          },
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    ios: {
      bundleIdentifier: "com.yourcompany.wavediaries"
    }
  }
};