plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.bobbyone"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.bobbyone"
        minSdk = 26
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("GITHUB_RUN_NUMBER") ?: "1")
    }

    signingConfigs {
        create("bobby") {
            storeFile = file("bobby.keystore")
            storePassword = "bobbyone"
            keyAlias = "bobby"
            keyPassword = "bobbyone"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("bobby")
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    lint { abortOnError = false }
}
