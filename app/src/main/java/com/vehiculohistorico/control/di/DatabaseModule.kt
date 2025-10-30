package com.vehiculohistorico.control.di

import android.content.Context
import androidx.room.Room
import com.vehiculohistorico.control.data.dao.*
import com.vehiculohistorico.control.data.database.VehiculoDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideVehiculoDatabase(@ApplicationContext context: Context): VehiculoDatabase {
        return Room.databaseBuilder(
            context.applicationContext,
            VehiculoDatabase::class.java,
            "vehiculo_database"
        ).build()
    }

    @Provides
    fun provideUsuarioDao(database: VehiculoDatabase): UsuarioDao =
        database.usuarioDao()

    @Provides
    fun provideVehiculoDao(database: VehiculoDatabase): VehiculoDao =
        database.vehiculoDao()

    @Provides
    fun provideDiaUsoDao(database: VehiculoDatabase): DiaUsoDao =
        database.diaUsoDao()

    @Provides
    fun provideVehiculoCompartidoDao(database: VehiculoDatabase): VehiculoCompartidoDao =
        database.vehiculoCompartidoDao()
}