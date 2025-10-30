package com.vehiculohistorico.control.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vehiculohistorico.control.data.entities.DiaUso
import com.vehiculohistorico.control.data.entities.Vehiculo
import com.vehiculohistorico.control.data.repository.VehiculoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class VehiculoViewModel @Inject constructor(
    private val vehiculoRepository: VehiculoRepository
) : ViewModel() {

    private val _usuarioId = MutableStateFlow<Long?>(null)
    val usuarioId: StateFlow<Long?> = _usuarioId

    private val _uiState = MutableStateFlow(VehiculoUiState())
    val uiState: StateFlow<VehiculoUiState> = _uiState

    val vehiculos = _usuarioId.flatMapLatest { id ->
        if (id != null) {
            vehiculoRepository.getVehiculosByUsuario(id)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun setUsuarioId(id: Long) {
        _usuarioId.value = id
    }

    fun agregarVehiculo(nombre: String, marca: String, modelo: String) {
        val usuarioId = _usuarioId.value ?: return
        
        viewModelScope.launch {
            try {
                val vehiculo = Vehiculo(
                    nombre = nombre,
                    marca = marca,
                    modelo = modelo,
                    usuarioId = usuarioId
                )
                vehiculoRepository.insertVehiculo(vehiculo)
                _uiState.value = _uiState.value.copy(showAddDialog = false)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al agregar vehículo")
            }
        }
    }

    fun eliminarVehiculo(vehiculo: Vehiculo) {
        viewModelScope.launch {
            try {
                vehiculoRepository.deleteVehiculo(vehiculo)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al eliminar vehículo")
            }
        }
    }

    fun agregarDiaUsoHoy(vehiculoId: Long) {
        val usuarioId = _usuarioId.value ?: return
        
        viewModelScope.launch {
            try {
                vehiculoRepository.agregarDiaUso(vehiculoId, usuarioId, Date())
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al agregar día de uso")
            }
        }
    }

    fun agregarDiaUsoFecha(vehiculoId: Long, fecha: Date) {
        val usuarioId = _usuarioId.value ?: return
        
        viewModelScope.launch {
            try {
                vehiculoRepository.agregarDiaUso(vehiculoId, usuarioId, fecha)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al agregar día de uso")
            }
        }
    }

    suspend fun getContadorDias(vehiculoId: Long): Int {
        return vehiculoRepository.getContadorDias(vehiculoId)
    }

    fun compartirVehiculo(vehiculoId: Long): String? {
        var codigo: String? = null
        val usuarioId = _usuarioId.value ?: return null
        
        viewModelScope.launch {
            try {
                codigo = vehiculoRepository.compartirVehiculo(vehiculoId, usuarioId)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al compartir vehículo")
            }
        }
        
        return codigo
    }

    fun showAddDialog() {
        _uiState.value = _uiState.value.copy(showAddDialog = true)
    }

    fun hideAddDialog() {
        _uiState.value = _uiState.value.copy(showAddDialog = false)
    }

    fun showDatePicker() {
        _uiState.value = _uiState.value.copy(showDatePicker = true)
    }

    fun hideDatePicker() {
        _uiState.value = _uiState.value.copy(showDatePicker = false)
    }

    fun showVehiculoSelector() {
        _uiState.value = _uiState.value.copy(showVehiculoSelector = true)
    }

    fun hideVehiculoSelector() {
        _uiState.value = _uiState.value.copy(showVehiculoSelector = false)
    }

    fun showVehiculoSelectorForDate() {
        _uiState.value = _uiState.value.copy(showVehiculoSelectorForDate = true)
    }

    fun hideVehiculoSelectorForDate() {
        _uiState.value = _uiState.value.copy(showVehiculoSelectorForDate = false)
    }

    fun setSelectedDate(date: Date) {
        _uiState.value = _uiState.value.copy(selectedDate = date)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun agregarVehiculoCompartido(codigo: String) {
        val usuarioId = _usuarioId.value ?: return
        
        viewModelScope.launch {
            try {
                val exito = vehiculoRepository.agregarVehiculoCompartido(codigo, usuarioId)
                if (exito) {
                    _uiState.value = _uiState.value.copy(showAddSharedDialog = false)
                } else {
                    _uiState.value = _uiState.value.copy(error = "Código de vehículo no válido")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(error = "Error al agregar vehículo compartido")
            }
        }
    }

    fun showAddSharedDialog() {
        _uiState.value = _uiState.value.copy(showAddSharedDialog = true)
    }

    fun hideAddSharedDialog() {
        _uiState.value = _uiState.value.copy(showAddSharedDialog = false)
    }
}

data class VehiculoUiState(
    val showAddDialog: Boolean = false,
    val showAddSharedDialog: Boolean = false,
    val showDatePicker: Boolean = false,
    val showVehiculoSelector: Boolean = false,
    val showVehiculoSelectorForDate: Boolean = false,
    val selectedVehiculoId: Long? = null,
    val selectedDate: Date? = null,
    val error: String? = null
)