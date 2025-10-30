package com.vehiculohistorico.control.data.repository

import com.vehiculohistorico.control.data.dao.*
import com.vehiculohistorico.control.data.entities.*
import kotlinx.coroutines.flow.Flow
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VehiculoRepository @Inject constructor(
    private val vehiculoDao: VehiculoDao,
    private val diaUsoDao: DiaUsoDao,
    private val vehiculoCompartidoDao: VehiculoCompartidoDao,
    private val usuarioDao: UsuarioDao
) {
    fun getVehiculosByUsuario(usuarioId: Long): Flow<List<Vehiculo>> =
        vehiculoDao.getVehiculosByUsuario(usuarioId)

    suspend fun insertVehiculo(vehiculo: Vehiculo): Long =
        vehiculoDao.insertVehiculo(vehiculo)

    suspend fun deleteVehiculo(vehiculo: Vehiculo) =
        vehiculoDao.deleteVehiculo(vehiculo)

    suspend fun updateVehiculo(vehiculo: Vehiculo) =
        vehiculoDao.updateVehiculo(vehiculo)

    fun getDiasUsoByVehiculo(vehiculoId: Long): Flow<List<DiaUso>> =
        diaUsoDao.getDiasUsoByVehiculo(vehiculoId)

    suspend fun getContadorDias(vehiculoId: Long): Int =
        diaUsoDao.getContadorDias(vehiculoId)

    suspend fun agregarDiaUso(vehiculoId: Long, usuarioId: Long, fecha: Date) {
        val usuario = usuarioDao.getUsuarioById(usuarioId)
        val diaExistente = diaUsoDao.getDiaUsoByFecha(vehiculoId, fecha)
        
        if (diaExistente == null && usuario != null) {
            val diaUso = DiaUso(
                vehiculoId = vehiculoId,
                usuarioId = usuarioId,
                fecha = fecha,
                nombreUsuario = usuario.nombre
            )
            diaUsoDao.insertDiaUso(diaUso)
        }
    }

    suspend fun eliminarDiaUso(diaUso: DiaUso) =
        diaUsoDao.deleteDiaUso(diaUso)

    suspend fun compartirVehiculo(vehiculoId: Long, usuarioId: Long): String {
        val codigo = UUID.randomUUID().toString().substring(0, 8)
        val vehiculo = vehiculoDao.getVehiculoById(vehiculoId)
        
        if (vehiculo != null) {
            vehiculoDao.updateVehiculo(
                vehiculo.copy(
                    compartido = true,
                    codigoCompartido = codigo
                )
            )
        }
        
        return codigo
    }

    suspend fun agregarVehiculoCompartido(codigo: String, usuarioId: Long): Boolean {
        val vehiculo = vehiculoDao.getVehiculoByCodigo(codigo)
        
        return if (vehiculo != null) {
            val vehiculoCompartido = VehiculoCompartido(
                vehiculoId = vehiculo.id,
                usuarioId = usuarioId,
                codigoCompartido = codigo
            )
            vehiculoCompartidoDao.insertVehiculoCompartido(vehiculoCompartido)
            true
        } else {
            false
        }
    }

    fun getVehiculosCompartidos(usuarioId: Long): Flow<List<VehiculoCompartido>> =
        vehiculoCompartidoDao.getVehiculosCompartidosByUsuario(usuarioId)

    suspend fun getVehiculoById(id: Long): Vehiculo? =
        vehiculoDao.getVehiculoById(id)
}