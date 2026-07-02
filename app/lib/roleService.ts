"use client";

export interface Role {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface Permission {
  code: string;
  name: string;
  description: string;
  module: string;
}

export const ALL_PERMISSIONS: Permission[] = [
  // Antrean Poli
  {
    code: "antrean_view",
    name: "Lihat Antrean Poli",
    description: "Melihat daftar antrean pasien dan memanggil pasien",
    module: "Antrean Poli",
  },
  // Rekam Medis (RME)
  {
    code: "rme_asesmen",
    name: "Asesmen Keperawatan",
    description: "Mengisi dan melihat asesmen keperawatan pasien",
    module: "Rekam Medis (RME)",
  },
  {
    code: "rme_soap",
    name: "SOAP Dokter",
    description: "Mengisi dan melihat catatan SOAP/medis dokter",
    module: "Rekam Medis (RME)",
  },
  {
    code: "rme_riwayat",
    name: "Riwayat Kunjungan",
    description: "Melihat riwayat kunjungan dan rekam medis pasien terdahulu",
    module: "Rekam Medis (RME)",
  },
  // Farmasi Resep BPJS
  {
    code: "farmasibpjs_resep",
    name: "Daftar Resep",
    description: "Melihat, memproses, memfinalkan, dan membatalkan resep obat BPJS",
    module: "Farmasi Resep BPJS",
  },
  {
    code: "farmasibpjs_referensi",
    name: "Referensi BPJS",
    description: "Mencari referensi DPHO, obat, poli, spesialis, dan faskes dari BPJS",
    module: "Farmasi Resep BPJS",
  },
  {
    code: "farmasibpjs_monitoring",
    name: "Monitoring Klaim",
    description: "Melihat dashboard monitoring klaim obat BPJS",
    module: "Farmasi Resep BPJS",
  },
  // Administrasi
  {
    code: "admin_register",
    name: "Registrasi User Baru",
    description: "Mendaftarkan akun pengguna baru ke sistem",
    module: "Administrasi",
  },
  {
    code: "admin_roles",
    name: "Kelola Role & Hak Akses",
    description: "Membuat role baru dan mengatur hak akses matrik perizinan",
    module: "Administrasi",
  },
];

const DEFAULT_ROLES: Role[] = [
  {
    code: "admin",
    name: "Administrator",
    description: "Akses penuh ke semua modul sistem dan pengaturan hak akses.",
    isSystem: true,
  },
  {
    code: "dokter",
    name: "Dokter Spesialis",
    description: "Menangani pemeriksaan pasien, mengisi rekam medis SOAP, dan melihat riwayat.",
    isSystem: true,
  },
  {
    code: "apoteker",
    name: "Apoteker / Farmasi",
    description: "Mengelola resep pasien, melakukan monitoring klaim, dan data referensi BPJS.",
    isSystem: true,
  },
  {
    code: "perawat",
    name: "Perawat",
    description: "Melakukan asesmen awal keperawatan pasien sebelum diperiksa dokter.",
    isSystem: true,
  },
];

const DEFAULT_MAPPING: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map((p) => p.code),
  dokter: ["antrean_view", "rme_soap", "rme_riwayat"],
  apoteker: ["antrean_view", "farmasibpjs_resep", "farmasibpjs_referensi", "farmasibpjs_monitoring"],
  perawat: ["antrean_view", "rme_asesmen", "rme_riwayat"],
};

export const roleService = {
  getRoles(): Role[] {
    if (typeof window === "undefined") return DEFAULT_ROLES;
    const stored = localStorage.getItem("sejiwa_roles");
    if (!stored) {
      localStorage.setItem("sejiwa_roles", JSON.stringify(DEFAULT_ROLES));
      return DEFAULT_ROLES;
    }
    return JSON.parse(stored);
  },

  getRolePermissions(roleCode: string): string[] {
    if (typeof window === "undefined") return DEFAULT_MAPPING[roleCode] || [];
    const stored = localStorage.getItem("sejiwa_role_permissions");
    if (!stored) {
      localStorage.setItem("sejiwa_role_permissions", JSON.stringify(DEFAULT_MAPPING));
      return DEFAULT_MAPPING[roleCode] || [];
    }
    const mapping = JSON.parse(stored);
    return mapping[roleCode] || [];
  },

  saveRole(role: Role, permissions: string[]): boolean {
    if (typeof window === "undefined") return false;
    try {
      // 1. Save Role Definition
      const roles = this.getRoles();
      const existingIndex = roles.findIndex((r) => r.code === role.code);
      if (existingIndex > -1) {
        roles[existingIndex] = { ...roles[existingIndex], name: role.name, description: role.description };
      } else {
        roles.push(role);
      }
      localStorage.setItem("sejiwa_roles", JSON.stringify(roles));

      // 2. Save Role Permissions mapping
      const storedMapping = localStorage.getItem("sejiwa_role_permissions");
      const mapping = storedMapping ? JSON.parse(storedMapping) : { ...DEFAULT_MAPPING };
      mapping[role.code] = permissions;
      localStorage.setItem("sejiwa_role_permissions", JSON.stringify(mapping));

      // Dispatch storage event to notify other components/tabs
      window.dispatchEvent(new Event("storage"));
      return true;
    } catch (error) {
      console.error("Failed to save role", error);
      return false;
    }
  },

  deleteRole(roleCode: string): boolean {
    if (typeof window === "undefined") return false;
    const roles = this.getRoles();
    const roleToDelete = roles.find((r) => r.code === roleCode);
    if (!roleToDelete || roleToDelete.isSystem) return false;

    try {
      // 1. Delete role definition
      const updatedRoles = roles.filter((r) => r.code !== roleCode);
      localStorage.setItem("sejiwa_roles", JSON.stringify(updatedRoles));

      // 2. Delete permission mapping
      const storedMapping = localStorage.getItem("sejiwa_role_permissions");
      if (storedMapping) {
        const mapping = JSON.parse(storedMapping);
        delete mapping[roleCode];
        localStorage.setItem("sejiwa_role_permissions", JSON.stringify(mapping));
      }

      window.dispatchEvent(new Event("storage"));
      return true;
    } catch (error) {
      console.error("Failed to delete role", error);
      return false;
    }
  },

  hasPermission(roleCode: string, permissionCode: string): boolean {
    // Admin always has all permissions
    if (roleCode === "admin") return true;
    const permissions = this.getRolePermissions(roleCode);
    return permissions.includes(permissionCode);
  },
};
