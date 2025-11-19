const { withProjectBuildGradle, withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withNotifeeRepos(config) {

  // Project-level build.gradle
  config = withProjectBuildGradle(config, (newConfig) => {
    let gradle = newConfig.modResults.contents;
    if (!gradle.includes("notifee.github.io")) {
      gradle = gradle.replace(
        /allprojects\s*{\s*repositories\s*{/,
`allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
        maven { url 'https://notifee.github.io/maven' }
        maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`
      );
    }
    newConfig.modResults.contents = gradle;
    return newConfig;
  });

  // App-level build.gradle
  config = withAppBuildGradle(config, (newConfig) => {
    let gradle = newConfig.modResults.contents;
    if (!gradle.includes("notifee.github.io")) {
      gradle = gradle.replace(
        /repositories\s*{/,
`repositories {
        maven { url 'https://notifee.github.io/maven' }
        maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`
      );
    }
    newConfig.modResults.contents = gradle;
    return newConfig;
  });

  return config;
};
