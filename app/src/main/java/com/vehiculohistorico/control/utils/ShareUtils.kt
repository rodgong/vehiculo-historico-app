package com.vehiculohistorico.control.utils

import android.content.Context
import android.content.Intent
import android.net.Uri

object ShareUtils {
    
    fun compartirVehiculoPorWhatsApp(context: Context, codigo: String, nombreVehiculo: String) {
        val mensaje = "¡Hola! Te comparto mi vehículo histórico '$nombreVehiculo' para que puedas agregar días de uso. " +
                "Usa este código en la app 'Control de Días Vehículo Histórico': $codigo"
        
        try {
            val intent = Intent(Intent.ACTION_VIEW)
            intent.data = Uri.parse("https://wa.me/?text=${Uri.encode(mensaje)}")
            context.startActivity(intent)
        } catch (e: Exception) {
            // Si WhatsApp no está instalado, usar compartir genérico
            compartirGenerico(context, mensaje)
        }
    }
    
    fun compartirVehiculoPorEmail(context: Context, codigo: String, nombreVehiculo: String) {
        val asunto = "Vehículo histórico compartido: $nombreVehiculo"
        val mensaje = "¡Hola!\n\n" +
                "Te comparto mi vehículo histórico '$nombreVehiculo' para que puedas agregar días de uso.\n\n" +
                "Para acceder:\n" +
                "1. Descarga la app 'Control de Días Vehículo Histórico'\n" +
                "2. Crea tu cuenta o inicia sesión\n" +
                "3. Usa este código para agregar el vehículo: $codigo\n\n" +
                "¡Saludos!"
        
        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_SUBJECT, asunto)
            putExtra(Intent.EXTRA_TEXT, mensaje)
        }
        
        try {
            context.startActivity(Intent.createChooser(intent, "Enviar por email"))
        } catch (e: Exception) {
            compartirGenerico(context, mensaje)
        }
    }
    
    private fun compartirGenerico(context: Context, mensaje: String) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, mensaje)
        }
        
        context.startActivity(Intent.createChooser(intent, "Compartir vehículo"))
    }
}