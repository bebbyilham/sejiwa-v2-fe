"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Breadcrumb, Button, Badge, Popover, Avatar, Space, Typography, Dropdown, MenuProps, Drawer, Modal, List, Tag, Tooltip, message } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TeamOutlined,
  FileTextOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PushpinOutlined,
  PushpinFilled
} from "@ant-design/icons";
import { useRouter, usePathname, useParams } from "next/navigation";
import { getUser, clearSession, apiRequest } from "../lib/api";
import Link from "next/link";
import { useTheme } from "../lib/ThemeContext";
import { roleService } from "../lib/roleService";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; name: string; role: string } | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // User Menu preferences state
  const [preferences, setPreferences] = useState<{ menu_key: string; order_index: number; is_pinned: boolean }[]>([]);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [modalPrefs, setModalPrefs] = useState<{ key: string; label: string; is_pinned: boolean }[]>([]);

  useEffect(() => {
    if (user) {
      const loadPermissions = () => {
        const perms = roleService.getRolePermissions(user.role);
        setPermissions(perms);
      };
      loadPermissions();
      window.addEventListener("storage", loadPermissions);
      return () => {
        window.removeEventListener("storage", loadPermissions);
      };
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const loggedUser = getUser();
    if (!loggedUser) {
      router.push("/");
    } else {
      setUser(loggedUser);
    }
  }, [router]);

  // Load preferences
  useEffect(() => {
    if (user) {
      const fetchPreferences = async () => {
        try {
          const res = await apiRequest("users/menu-preferences");
          if (res.status && res.data) {
            setPreferences(res.data);
          }
        } catch (e) {
          console.error("Gagal memuat preferensi menu:", e);
        }
      };
      fetchPreferences();
    }
  }, [user]);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter((x) => x);
    const items = [
      {
        title: (
          <Link href="/antrean">
            <HomeOutlined /> Beranda
          </Link>
        ),
      },
    ];

    paths.forEach((path, index) => {
      const url = `/${paths.slice(0, index + 1).join("/")}`;
      let title = path.charAt(0).toUpperCase() + path.slice(1);

      if (path === "antrean") title = "Antrean Poli";
      else if (path === "rme") title = "RME Pasien";
      else if (params.patientId && path === params.patientId) {
        title = `No. RM: ${params.patientId}`;
      } else if (path === "soap") title = "SOAP Dokter";
      else if (path === "asesmen") title = "Asesmen Keperawatan";
      else if (path === "riwayat") title = "Riwayat Kunjungan";

      items.push({
        title: index === paths.length - 1 ? <span>{title}</span> : <Link href={url}>{title}</Link>,
      });
    });

    return items;
  };

  // Mock clinical notifications
  const notifications = [
    { id: 1, text: "Hasil Laboratorium Tn. Arwan Kasri (000544) selesai.", type: "lab" },
    { id: 2, text: "Konsultasi Rujukan Internal Poli Jantung selesai.", type: "referral" },
    { id: 3, text: "Pasien Baru Antrean Poli Penyakit Dalam: Ny. Siti Aminah.", type: "queue" },
  ];

  const notificationContent = (
    <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 8 }}>
      {notifications.map((item) => (
        <div key={item.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-divider)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <MedicineBoxOutlined style={{ color: "var(--primary-color)", marginTop: 4 }} />
          <Text style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.text}</Text>
        </div>
      ))}
      <div style={{ textAlign: "center", fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-divider)" }}>
        <Link href="/notifikasi" style={{ color: "var(--primary-color)" }}>Lihat Semua Notifikasi</Link>
      </div>
    </div>
  );

  const userMenuItems: MenuProps['items'] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profil Saya",
      onClick: () => router.push("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Keluar",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const hasAccess = (permissionCode: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return permissions.includes(permissionCode);
  };

  const getCustomizableMenus = () => {
    const list = [
      { key: "antrean", label: "Antrean" },
      { key: "rme", label: "Rekam Medis" },
      { key: "farmasi", label: "Farmasi" },
      { key: "administrasi", label: "Administrasi" }
    ];

    return list.filter(item => {
      if (item.key === "antrean") return hasAccess("antrean_view");
      if (item.key === "rme") return hasAccess("rme_asesmen") || hasAccess("rme_soap") || hasAccess("rme_riwayat");
      if (item.key === "farmasi") return hasAccess("farmasibpjs_resep") || hasAccess("farmasibpjs_referensi") || hasAccess("farmasibpjs_monitoring");
      if (item.key === "administrasi") return hasAccess("admin_register") || hasAccess("admin_roles");
      return false;
    });
  };

  const openCustomizeModal = () => {
    const customizable = getCustomizableMenus();
    const prefMap = new Map(preferences.map(p => [p.menu_key, p]));

    const currentPrefs = customizable.map(item => {
      const pref = prefMap.get(item.key);
      return {
        key: item.key,
        label: item.label,
        is_pinned: pref ? pref.is_pinned : false,
        order_index: pref !== undefined ? pref.order_index : 999
      };
    });

    currentPrefs.sort((a, b) => a.order_index - b.order_index);

    setModalPrefs(currentPrefs.map(c => ({ key: c.key, label: c.label, is_pinned: c.is_pinned })));
    setIsPrefModalOpen(true);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newPrefs = [...modalPrefs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newPrefs.length) return;

    const temp = newPrefs[index];
    newPrefs[index] = newPrefs[targetIndex];
    newPrefs[targetIndex] = temp;

    setModalPrefs(newPrefs);
  };

  const togglePinItem = (key: string) => {
    const newPrefs = modalPrefs.map(item => {
      if (item.key === key) {
        return { ...item, is_pinned: !item.is_pinned };
      }
      return item;
    });
    setModalPrefs(newPrefs);
  };

  const savePreferences = async () => {
    try {
      const payload = modalPrefs.map((item, index) => ({
        menu_key: item.key,
        order_index: index,
        is_pinned: item.is_pinned
      }));

      const res = await apiRequest("users/menu-preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: payload })
      });

      if (res.status) {
        message.success("Susunan menu sidebar berhasil diperbarui!");
        setPreferences(payload);
        setIsPrefModalOpen(false);
      } else {
        message.error("Gagal menyimpan preferensi menu.");
      }
    } catch (e: any) {
      message.error("Terjadi kesalahan: " + e.message);
    }
  };

  const getDynamicMenuItems = () => {
    if (!user) return [];

    const baseItemsMap: Record<string, any> = {};

    // 1. Antrean Poli
    if (hasAccess("antrean_view")) {
      baseItemsMap["antrean"] = {
        key: "/antrean",
        icon: <TeamOutlined />,
        label: "Antrean",
        onClick: () => {
          router.push("/antrean");
          if (isMobile) setDrawerVisible(false);
        },
      };
    }

    // 2. Rekam Medis (RME)
    const rmeChildren: any[] = [];
    if (params.patientId) {
      if (hasAccess("rme_asesmen")) {
        rmeChildren.push({
          key: `/rme/${params.patientId}/asesmen`,
          label: "Asesmen Perawat",
          onClick: () => {
            router.push(`/rme/${params.patientId}/asesmen`);
            if (isMobile) setDrawerVisible(false);
          },
        });
      }
      if (hasAccess("rme_soap")) {
        rmeChildren.push({
          key: `/rme/${params.patientId}/soap`,
          label: "SOAP Dokter",
          onClick: () => {
            router.push(`/rme/${params.patientId}/soap`);
            if (isMobile) setDrawerVisible(false);
          },
        });
      }
      if (hasAccess("rme_riwayat")) {
        rmeChildren.push({
          key: `/rme/${params.patientId}/riwayat`,
          label: "Riwayat Medis",
          onClick: () => {
            router.push(`/rme/${params.patientId}/riwayat`);
            if (isMobile) setDrawerVisible(false);
          },
        });
      }
    } else {
      if (hasAccess("rme_asesmen") || hasAccess("rme_soap") || hasAccess("rme_riwayat")) {
        rmeChildren.push({
          key: "/antrean-list-redirect",
          label: "Pilih Pasien",
          onClick: () => {
            router.push("/antrean");
            if (isMobile) setDrawerVisible(false);
          },
        });
      }
    }

    if (rmeChildren.length > 0) {
      baseItemsMap["rme"] = {
        key: "rme-section",
        icon: <FileTextOutlined />,
        label: "Rekam Medis",
        children: rmeChildren,
      };
    }

    // 3. Farmasi Resep BPJS
    const farmasiChildren: any[] = [];
    if (hasAccess("farmasibpjs_resep")) {
      farmasiChildren.push({
        key: "/farmasibpjs/daftarresep",
        label: "Daftar Resep",
        onClick: () => {
          router.push("/farmasibpjs/daftarresep");
          if (isMobile) setDrawerVisible(false);
        },
      });
    }
    if (hasAccess("farmasibpjs_referensi")) {
      farmasiChildren.push({
        key: "/farmasibpjs/referensi",
        label: "Referensi",
        onClick: () => {
          router.push("/farmasibpjs/referensi");
          if (isMobile) setDrawerVisible(false);
        },
      });
    }
    if (hasAccess("farmasibpjs_monitoring")) {
      farmasiChildren.push({
        key: "/farmasibpjs/monitoring",
        label: "Monitoring",
        onClick: () => {
          router.push("/farmasibpjs/monitoring");
          if (isMobile) setDrawerVisible(false);
        },
      });
    }

    if (farmasiChildren.length > 0) {
      baseItemsMap["farmasi"] = {
        key: "farmasi-bpjs-section",
        icon: <MedicineBoxOutlined />,
        label: "Farmasi",
        children: farmasiChildren,
      };
    }

    // 4. Administrasi
    const adminChildren: any[] = [];
    if (hasAccess("admin_register")) {
      adminChildren.push({
        key: "/admin/register",
        label: "Registrasi User",
        onClick: () => {
          router.push("/admin/register");
          if (isMobile) setDrawerVisible(false);
        },
      });
    }
    if (hasAccess("admin_roles")) {
      adminChildren.push({
        key: "/admin/roles",
        label: "Role & Akses",
        onClick: () => {
          router.push("/admin/roles");
          if (isMobile) setDrawerVisible(false);
        },
      });
    }

    if (adminChildren.length > 0) {
      baseItemsMap["administrasi"] = {
        key: "admin-section",
        icon: <UserOutlined />,
        label: "Administrasi",
        children: adminChildren,
      };
    }

    const orderedKeys = ["antrean", "rme", "farmasi", "administrasi"];
    const prefMap = new Map(preferences.map(p => [p.menu_key, p]));

    const sortedKeys = [...orderedKeys].sort((a, b) => {
      const prefA = prefMap.get(a);
      const prefB = prefMap.get(b);

      const isPinnedA = prefA?.is_pinned ? 1 : 0;
      const isPinnedB = prefB?.is_pinned ? 1 : 0;

      if (isPinnedA !== isPinnedB) {
        return isPinnedB - isPinnedA;
      }

      const orderA = prefA !== undefined ? prefA.order_index : 999;
      const orderB = prefB !== undefined ? prefB.order_index : 999;
      return orderA - orderB;
    });

    const items: any[] = [];
    sortedKeys.forEach(key => {
      if (baseItemsMap[key]) {
        const item = baseItemsMap[key];
        const pref = prefMap.get(key);
        if (pref?.is_pinned) {
          item.label = (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span>{item.label}</span>
              <PushpinFilled style={{ color: "#fa8c16", fontSize: 12, marginLeft: 8 }} />
            </span>
          );
        }
        items.push(item);
      }
    });

    // Add customize link at bottom
    items.push({
      key: "/customize-sidebar",
      icon: <SettingOutlined style={{ color: "#1890ff" }} />,
      label: <span style={{ color: "#1890ff", fontWeight: 500 }}>Atur Menu Sidebar</span>,
      onClick: openCustomizeModal
    });

    return items;
  };

  const sideMenu = (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[pathname]}
      style={{ padding: "16px 0" }}
      items={getDynamicMenuItems()}
    />
  );

  if (!user) return null;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Mobile Sidebar (Drawer) */}
      {isMobile ? (
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <MedicineBoxOutlined style={{ fontSize: 24, color: "#1890ff", marginRight: 10 }} />
              <Title level={4} style={{ margin: 0, color: "#1890ff", fontWeight: 700 }}>
                SEJIWA
              </Title>
            </div>
          }
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          size={280}
          className="glass-drawer"
          styles={{
            body: { padding: 0 }
          }}
        >
          <div className="glass-sider" style={{ height: "100%" }}>
            {sideMenu}
          </div>
        </Drawer>
      ) : (
        /* Desktop Sidebar (Sider) */
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          className="glass-sider"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: "0 24px",
              background: "transparent",
              borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <MedicineBoxOutlined style={{ fontSize: 24, color: "#1890ff", marginRight: collapsed ? 0 : 10 }} />
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: "#1890ff", fontWeight: 700 }}>
                SEJIWA
              </Title>
            )}
          </div>
          {sideMenu}
        </Sider>
      )}

      <Layout>
        <Header
          className="glass-header"
          style={{
            padding: isMobile ? "0 12px" : "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <Space size={isMobile ? "small" : "large"}>
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}
              style={{ fontSize: "16px", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
              <Text strong style={{ fontSize: isMobile ? 13 : 15, color: "#1890ff" }}>
                {user ? user.name : "Memuat..."}
              </Text>
              {!isMobile && (
                <Text type="secondary" style={{ fontSize: 11, textTransform: "capitalize" }}>
                  Role: {user ? user.role : "-"}
                </Text>
              )}
            </div>
          </Space>

          <Space size={isMobile ? "small" : "middle"}>
            <Button
              type="text"
              shape="circle"
              icon={theme === "dark" ? <SunOutlined style={{ fontSize: isMobile ? 18 : 20, color: "#faad14" }} /> : <MoonOutlined style={{ fontSize: isMobile ? 18 : 20 }} />}
              onClick={toggleTheme}
            />
            <Popover content={notificationContent} title="Notifikasi Medis" trigger="click" placement="bottomRight">
              <Badge count={notifications.length} offset={[2, -2]} size="small">
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: isMobile ? 18 : 20 }} />} />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: "pointer" }}>
                <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} size={isMobile ? "small" : "default"} />
                {!isMobile && <Text style={{ fontSize: 14 }}>{user.name}</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? "0 12px 12px" : "0 24px 24px", display: "flex", flexDirection: "column" }}>
          <Breadcrumb style={{ margin: "12px 0", fontSize: isMobile ? 12 : 14 }} items={getBreadcrumbs()} />
          <div style={{ flex: 1, minHeight: 280 }}>
            {children}
          </div>
        </Content>
      </Layout>

      {/* Modal Kustomisasi Sidebar */}
      <Modal
        title={<strong>Kustomisasi Susunan Menu Sidebar</strong>}
        open={isPrefModalOpen}
        onCancel={() => setIsPrefModalOpen(false)}
        onOk={savePreferences}
        okText="Simpan Susunan"
        cancelText="Batal"
        width={450}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Gunakan tombol panah untuk mengurutkan menu naik/turun, dan klik ikon pin untuk menyematkan menu ke bagian atas sidebar.
        </Typography.Paragraph>
        <List
          bordered
          dataSource={modalPrefs}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Button
                  key="up"
                  type="text"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => moveItem(index, "up")}
                />,
                <Button
                  key="down"
                  type="text"
                  icon={<ArrowDownOutlined />}
                  disabled={index === modalPrefs.length - 1}
                  onClick={() => moveItem(index, "down")}
                />,
                <Button
                  key="pin"
                  type="text"
                  icon={item.is_pinned ? <PushpinFilled style={{ color: "#fa8c16" }} /> : <PushpinOutlined />}
                  onClick={() => togglePinItem(item.key)}
                />
              ]}
            >
              <Space>
                <strong>{item.label}</strong>
                {item.is_pinned && <Tag color="orange">Pinned</Tag>}
              </Space>
            </List.Item>
          )}
        />
      </Modal>
    </Layout>
  );
}
