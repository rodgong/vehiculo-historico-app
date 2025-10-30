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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.vehiculohistorico.control.data.entities.DiaUso
import com.vehiculohistorico.control.data.entities.Vehiculo
import com.vehiculohistorico.control.data.repository.VehiculoRepository
import com.vehiculohistorico.control.utils.ShareUtils
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiculoDetailScreen(
    vehiculoId: Long,
    onBack: () -> Unit,
    vehiculoRepository: VehiculoRepository
) {
    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var diasUso by remember { mutableStateOf<List<DiaUso>>(emptyList()) }
    var contadorDias by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(vehiculoId) {
        vehiculo = vehiculoRepository.getVehiculoById(vehiculoId)
        vehiculoRepository.getDiasUsoByVehiculo(vehiculoId).collect {
            diasUso = it
        }
        contadorDias = vehiculoRepository.getContadorDias(vehiculoId)
    }

    vehiculo?.let { v ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                }
                
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = v.nombre,
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = "${v.marca} ${v.modelo}",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Contador de días con alertas
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = when {
                        contadorDias >= 96 -> MaterialTheme.colorScheme.error
                        contadorDias >= 90 -> Color(0xFFFF9800)
                        else -> MaterialTheme.colorScheme.primaryContainer
                    }
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Días de uso: $contadorDias",
                        style = MaterialTheme.typography.headlineMedium
                    )
                    
                    when {
                        contadorDias >= 96 -> {
                            Text(
                                text = "⚠️ Límite de uso alcanzado",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onError
                            )
                        }
                        contadorDias >= 90 -> {
                            Text(
                                text = "⚠️ Se acerca al límite de uso",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        scope.launch {
                            val codigo = vehiculoRepository.compartirVehiculo(vehiculoId, v.usuarioId)
                            ShareUtils.compartirVehiculoPorWhatsApp(context, codigo, v.nombre)
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("WhatsApp")
                }
                
                Button(
                    onClick = {
                        scope.launch {
                            val codigo = vehiculoRepository.compartirVehiculo(vehiculoId, v.usuarioId)
                            ShareUtils.compartirVehiculoPorEmail(context, codigo, v.nombre)
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Email")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Historial de uso",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(diasUso) { diaUso ->
                    DiaUsoCard(
                        diaUso = diaUso,
                        onDelete = {
                            scope.launch {
                                vehiculoRepository.eliminarDiaUso(diaUso)
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun DiaUsoCard(
    diaUso: DiaUso,
    onDelete: () -> Unit
) {
    val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    
    Card(
        modifier = Modifier.fillMaxWidth()
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
                    text = dateFormat.format(diaUso.fecha),
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "Usuario: ${diaUso.nombreUsuario}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Eliminar día"
                )
            }
        }
    }
}