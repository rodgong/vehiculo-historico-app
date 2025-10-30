package com.vehiculohistorico.control.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vehiculos")
data class Vehiculo(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val nombre: String,
    val marca: String,
    val modelo: String,
    val usuarioId: Long,
    val compartido: Boolean = false,
    val codigoCompartido: String? = null
)