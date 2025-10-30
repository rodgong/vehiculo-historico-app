package com.vehiculohistorico.control.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.vehiculohistorico.control.data.dao.*
import com.vehiculohistorico.control.data.entities.*

@Database(
    entities = [Usuario::class, Vehiculo::class, DiaUso::class, VehiculoCompartido::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class VehiculoDatabase : RoomDatabase() {
    abstract fun usuarioDao(): UsuarioDao
    abstract fun vehiculoDao(): VehiculoDao
    abstract fun diaUsoDao(): DiaUsoDao
    abstract fun vehiculoCompartidoDao(): VehiculoCompartidoDao

    companion object {
        @Volatile
        private var INSTANCE: VehiculoDatabase? = null

        fun getDatabase(context: Context): VehiculoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    VehiculoDatabase::class.java,
                    "vehiculo_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}