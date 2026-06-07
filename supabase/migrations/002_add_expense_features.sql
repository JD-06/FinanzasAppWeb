-- Añadir nuevas columnas a la tabla de gastos
alter table expenses
add column status text not null default 'pagado' check (status in ('pagado', 'pendiente')),
add column is_msi boolean not null default false,
add column msi_months integer not null default 0 check (msi_months >= 0);

-- Comentario: 
-- "status" indica si el gasto ya se liquidó o es un compromiso a futuro.
-- "is_msi" indica si fue una compra a Meses Sin Intereses.
-- "msi_months" guarda la cantidad de meses de la promoción (ej. 3, 6, 12).
