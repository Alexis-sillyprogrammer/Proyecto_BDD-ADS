function requireAuth(req, res, next) {
    if (!req.session.usuarioId) {
        return res.status(401).json({ error: 'Inicio de Sesión Requerido' });
    }
    next();
}

function requireRol(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.session.rol)) {
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRol };