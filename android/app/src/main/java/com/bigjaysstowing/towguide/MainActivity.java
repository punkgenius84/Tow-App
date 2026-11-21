package com.bigjaysstowing.towguide;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // Let the web app return from vehicle details/tabs before the Activity exits.
        getBridge().getWebView().evaluateJavascript(
            "(function(){return typeof window.__towBack === 'function' ? window.__towBack() : false;})()",
            value -> {
                if (!"true".equals(value)) MainActivity.super.onBackPressed();
            }
        );
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Keep the native VIN scanner registered before the Capacitor bridge starts.
        registerPlugin(NativeVinScannerPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(
            new NetworkStatus(this), "AndroidNetwork"
        );
    }

    public static class NetworkStatus {
        private final Context context;

        NetworkStatus(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public boolean isConnected() {
            ConnectivityManager manager =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (manager == null) return false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network active = manager.getActiveNetwork();
                if (active == null) return false;
                NetworkCapabilities capabilities = manager.getNetworkCapabilities(active);
                return capabilities != null
                    && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
            }

            android.net.NetworkInfo info = manager.getActiveNetworkInfo();
            return info != null && info.isConnected();
        }
    }
}
