plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.cercle"
    compileSdk = 34

    defaultConfig {
        applicationId = "app.cercle.prive"
        minSdk = 26
        targetSdk = 34
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("GITHUB_RUN_NUMBER") ?: "1")
    }

    signingConfigs {
        create("cercle") {
            storeFile = file("cercle.keystore")
            storePassword = "cerclepass"
            keyAlias = "cercle"
            keyPassword = "cerclepass"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("cercle")
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
