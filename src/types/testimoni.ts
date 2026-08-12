export interface Testimoni {
  id: number;
  name: string;
  pekerjaan: string;
  jenis_kelamin: |"Laki-laki" | "Perempuan";
  tanggal_lahir: Date | null;
  created_at: string;
  updated_at: string;
}