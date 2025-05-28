import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

const ProtectedRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const validateUser = async () => {
            try {
                const response = await api.get('/auth/adminvalidate');
                const data = response.data;
                console.log("ProtectedRoute", data.statusCode);
                if (data.statusCode === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Error validating admin:', err);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        validateUser();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>; // or a spinner
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
