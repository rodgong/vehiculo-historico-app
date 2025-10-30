package com.vehiculohistorico.control.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun AddSharedVehiculoDialog(
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var codigo by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Agregar Vehículo Compartido") },
        text = {
            Column {
                Text(
                    text = "Ingresa el código del vehículo que te han compartido:",
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = codigo,
                    onValueChange = { codigo = it },
                    label = { Text("Código del vehículo") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (codigo.isNotBlank()) {
                        onConfirm(codigo.trim())
                    }
                }
            ) {
                Text("Agregar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}