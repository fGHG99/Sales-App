export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || "0.0.0.0";

export const getServerConfig = () => ({ PORT, HOST });
