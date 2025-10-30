package com.vehiculohistorico.control

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vehiculohistorico.control.data.repository.VehiculoRepository
import com.vehiculohistorico.control.ui.screens.LoginScreen
import com.vehiculohistorico.control.ui.screens.VehiculoDetailScreen
import com.vehiculohistorico.control.ui.screens.VehiculoListScreen
import com.vehiculohistorico.control.ui.theme.VehiculoHistoricoTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var vehiculoRepository: VehiculoRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VehiculoHistoricoTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    VehiculoHistoricoApp(vehiculoRepository)
                }
            }
        }
    }
}

@Composable
fun VehiculoHistoricoApp(
    vehiculoRepository: VehiculoRepository,
    navController: NavHostController = rememberNavController()
) {
    var usuarioId by remember { mutableStateOf<Long?>(null) }

    NavHost(
        navController = navController,
        startDestination = if (usuarioId == null) "login" else "vehiculos"
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { id ->
                    usuarioId = id
                    navController.navigate("vehiculos") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("vehiculos") {
            usuarioId?.let { id ->
                VehiculoListScreen(
                    usuarioId = id,
                    onVehiculoClick = { vehiculoId ->
                        navController.navigate("vehiculo_detail/$vehiculoId")
                    }
                )
            }
        }

        composable("vehiculo_detail/{vehiculoId}") { backStackEntry ->
            val vehiculoId = backStackEntry.arguments?.getString("vehiculoId")?.toLongOrNull()
            vehiculoId?.let { id ->
                VehiculoDetailScreen(
                    vehiculoId = id,
                    onBack = { navController.popBackStack() },
                    vehiculoRepository = vehiculoRepository
                )
            }
        }
    }
}