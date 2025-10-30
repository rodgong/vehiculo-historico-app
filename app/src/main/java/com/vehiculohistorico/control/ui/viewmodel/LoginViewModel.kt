package com.vehiculohistorico.control.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vehiculohistorico.control.data.entities.Usuario
import com.vehiculohistorico.control.data.repository.UsuarioRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val usuarioRepository: UsuarioRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState

    private val _usuario = MutableStateFlow<Usuario?>(null)
    val usuario: StateFlow<Usuario?> = _usuario

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                val usuario = usuarioRepository.login(email, password)
                if (usuario != null) {
                    _usuario.value = usuario
                    _uiState.value = _uiState.value.copy(isLoading = false, loginSuccess = true)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Credenciales incorrectas"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error de conexión"
                )
            }
        }
    }

    fun registrar(nombre: String, email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                val usuarioId = usuarioRepository.registrarUsuario(nombre, email, password)
                if (usuarioId != null) {
                    val usuario = usuarioRepository.getUsuarioById(usuarioId)
                    _usuario.value = usuario
                    _uiState.value = _uiState.value.copy(isLoading = false, loginSuccess = true)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "El email ya está registrado"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error al registrar usuario"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class LoginUiState(
    val isLoading: Boolean = false,
    val loginSuccess: Boolean = false,
    val error: String? = null
)