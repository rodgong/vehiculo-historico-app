package com.vehiculohistorico.control.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vehiculohistorico.control.data.entities.Vehiculo
import com.vehiculohistorico.control.ui.viewmodel.VehiculoViewModel
import com.vehiculohistorico.control.ui.components.AddVehiculoDialog
import com.vehiculohistorico.control.ui.components.VehiculoSelectorDialog
import com.vehiculohistorico.control.ui.components.DatePickerDialog
import com.vehiculohistorico.control.ui.components.AddSharedVehiculoDialog
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiculoListScreen(
    usuarioId: Long,
    onVehiculoClick: (Long) -> Unit,
    viewModel: VehiculoViewModel = hiltViewModel()
) {
    LaunchedEffect(usuarioId) {
        viewModel.setUsuarioId(usuarioId)
    }

    val vehiculos by viewModel.vehiculos.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Mis Vehículos Históricos",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.showAddDialog() },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Nuevo")
            }

            Button(
                onClick = { viewModel.showAddSharedDialog() },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Share, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Código")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { viewModel.showVehiculoSelector() },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Today, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Hoy")
            }

            Button(
                onClick = { viewModel.showDatePicker() },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.DateRange, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Fecha")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(vehiculos) { vehiculo ->
                VehiculoCard(
                    vehiculo = vehiculo,
                    onClick = { onVehiculoClick(vehiculo.id) },
                    onDelete = { viewModel.eliminarVehiculo(vehiculo) },
                    viewModel = viewModel
                )
            }
        }
    }

    // Diálogos
    if (uiState.showAddDialog) {
        AddVehiculoDialog(
            onDismiss = { viewModel.hideAddDialog() },
            onConfirm = { nombre, marca, modelo ->
                viewModel.agregarVehiculo(nombre, marca, modelo)
            }
        )
    }

    if (uiState.showVehiculoSelector) {
        VehiculoSelectorDialog(
            vehiculos = vehiculos,
            onDismiss = { viewModel.hideVehiculoSelector() },
            onVehiculoSelected = { vehiculoId ->
                viewModel.agregarDiaUsoHoy(vehiculoId)
                viewModel.hideVehiculoSelector()
            }
        )
    }

    if (uiState.showDatePicker) {
        DatePickerDialog(
            onDismiss = { viewModel.hideDatePicker() },
            onDateSelected = { fecha ->
                viewModel.setSelectedDate(fecha)
                viewModel.showVehiculoSelectorForDate()
                viewModel.hideDatePicker()
            }
        )
    }

    if (uiState.showVehiculoSelectorForDate) {
        VehiculoSelectorDialog(
            vehiculos = vehiculos,
            onDismiss = { viewModel.hideVehiculoSelectorForDate() },
            onVehiculoSelected = { vehiculoId ->
                uiState.selectedDate?.let { fecha ->
                    viewModel.agregarDiaUsoFecha(vehiculoId, fecha)
                }
                viewModel.hideVehiculoSelectorForDate()
            }
        )
    }

    if (uiState.showAddSharedDialog) {
        AddSharedVehiculoDialog(
            onDismiss = { viewModel.hideAddSharedDialog() },
            onConfirm = { codigo ->
                viewModel.agregarVehiculoCompartido(codigo)
            }
        )
    }

    uiState.error?.let { error ->
        LaunchedEffect(error) {
            // Mostrar snackbar o toast
            viewModel.clearError()
        }
    }
}

@Composable
fun VehiculoCard(
    vehiculo: Vehiculo,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    viewModel: VehiculoViewModel
) {
    var contadorDias by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(vehiculo.id) {
        contadorDias = viewModel.getContadorDias(vehiculo.id)
    }

    val cardColor = when {
        contadorDias >= 96 -> MaterialTheme.colorScheme.error
        contadorDias >= 90 -> Color(0xFFFF9800) // Orange
        else -> MaterialTheme.colorScheme.surface
    }

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = cardColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = vehiculo.nombre,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${vehiculo.marca} ${vehiculo.modelo}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Días de uso: $contadorDias",
                    style = MaterialTheme.typography.bodySmall
                )
            }

            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Eliminar vehículo"
                )
            }
        }
    }
}