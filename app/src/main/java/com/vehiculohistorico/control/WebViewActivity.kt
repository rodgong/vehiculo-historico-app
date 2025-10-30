package com.vehiculohistorico.control

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class WebViewActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_webview)

        webView = findViewById(R.id.webview)
        
        // Configurar WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(true)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
        }

        // Cliente web personalizado
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                return when {
                    url.startsWith("https://wa.me/") -> {
                        // Abrir WhatsApp
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        true
                    }
                    url.startsWith("mailto:") -> {
                        // Abrir email
                        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse(url))
                        startActivity(intent)
                        true
                    }
                    url.startsWith("https://rodgong.github.io/") -> {
                        // Cargar en WebView
                        false
                    }
                    else -> {
                        // Abrir en navegador externo
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        true
                    }
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Ocultar splash screen si tienes uno
            }
        }

        // Chrome client para file uploads
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                // Log de consola para debugging
                return super.onConsoleMessage(consoleMessage)
            }
        }

        // Cargar tu aplicación web
        webView.loadUrl("https://rodgong.github.io/vehiculo-historico-app/")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}