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
        // La clé est secrète : elle n'est JAMAIS dans le dépôt. GitHub la fournit au moment de construire
        // (secret du dépôt), via les variables SIGNING_KEYSTORE_FILE et SIGNING_PASSWORD.
        create("bobby") {
            val ks = System.getenv("SIGNING_KEYSTORE_FILE")
            if (ks != null) {
                storeFile = file(ks)
                storeType = "pkcs12"
                storePassword = System.getenv("SIGNING_PASSWORD")
                keyAlias = "release"
                keyPassword = System.getenv("SIGNING_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            if (System.getenv("SIGNING_KEYSTORE_FILE") != null) signingConfig = signingConfigs.getByName("bobby")
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
