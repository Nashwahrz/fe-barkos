import { fetchApi } from "@/lib/api"

export const testimoniApi = {
    getAll: async () => {
        return await fetchApi("/testimonis");
    },


     create: async (data: { 
        nama:  string; 
        pekerjaan: string; 
        jenis_kelamin: "Laki-laki" | "Perempuan"; 
        tanggal_lahir: Date | null 
    }) => {
        return await fetchApi("/testimonis", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    update: async (id: number, data: Partial<{
        nama: string;
        pekerjaan: string;
        jenis_kelamin: "Laki-laki" | "Perempuan";
        tanggal_lahir: Date | null;
    }>) => {
        return await fetchApi(`/testimonis/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    delete: async (id: number) => {
        return await fetchApi(`/testimonis/${id}`, {
            method: "DELETE",
        });
    }

    }