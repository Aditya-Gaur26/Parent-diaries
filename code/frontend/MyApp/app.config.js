export default {
  expo: {
    scheme: "wavediaries",
    android: {
      intentFilters: [
        {
          action: "android.intent.action.VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "wavediaries"
            }
          ],
          category: [
            "android.intent.category.DEFAULT", 
            "android.intent.category.BROWSABLE"
          ]
        }
      ]
    },
    ios: {
      bundleIdentifier: "com.yourcompany.wavediaries"
    }
  }
};