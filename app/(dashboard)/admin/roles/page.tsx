"use client";

import React, { useState, useEffect } from "react";
import {
  Card, Typography, Row, Col, Checkbox, Switch, Button, Badge,
  Modal, Form, Input, Select, Breadcrumb, Result, App, Tooltip, Divider, Space
} from "antd";
import {
  SafetyCertificateOutlined, PlusOutlined, DeleteOutlined, KeyOutlined,
  SaveOutlined, ArrowLeftOutlined, CopyOutlined, FormOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getUser } from "../../../lib/api";
import { roleService, Role, ALL_PERMISSIONS, Permission } from "../../../lib/roleService";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function ManageRolesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // State for Roles & Permissions
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Modal State for New Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Load User & Roles
  useEffect(() => {
    const user = getUser();
    if (user && user.role === "admin") {
      setIsAdmin(true);
      loadRolesData();
    } else {
      setIsAdmin(false);
    }
  }, []);

  const loadRolesData = () => {
    const fetchedRoles = roleService.getRoles();
    setRoles(fetchedRoles);
    
    // Auto-select first role if none selected or if previously selected role no longer exists
    if (fetchedRoles.length > 0) {
      if (!selectedRole || !fetchedRoles.some(r => r.code === selectedRole.code)) {
        handleSelectRole(fetchedRoles[0]);
      } else {
        // Refresh permissions for currently selected role
        const permissions = roleService.getRolePermissions(selectedRole.code);
        setActivePermissions(permissions);
      }
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    const permissions = roleService.getRolePermissions(role.code);
    setActivePermissions(permissions);
  };

  // Toggle permission
  const handleTogglePermission = (permissionCode: string, checked: boolean) => {
    if (checked) {
      setActivePermissions(prev => [...prev, permissionCode]);
    } else {
      setActivePermissions(prev => prev.filter(code => code !== permissionCode));
    }
  };

  // Toggle all permissions inside a specific module
  const handleToggleModuleAll = (moduleName: string, checked: boolean) => {
    const modulePermissionCodes = ALL_PERMISSIONS
      .filter(p => p.module === moduleName)
      .map(p => p.code);

    if (checked) {
      setActivePermissions(prev => {
        const otherPermissions = prev.filter(code => !modulePermissionCodes.includes(code));
        return [...otherPermissions, ...modulePermissionCodes];
      });
    } else {
      setActivePermissions(prev => prev.filter(code => !modulePermissionCodes.includes(code)));
    }
  };

  // Save current role permissions
  const handleSavePermissions = () => {
    if (!selectedRole) return;
    setSaving(true);
    
    // Artificially delay slightly for UX feel
    setTimeout(() => {
      const success = roleService.saveRole(selectedRole, activePermissions);
      setSaving(false);
      if (success) {
        message.success(`Hak akses untuk role '${selectedRole.name}' berhasil disimpan!`);
      } else {
        message.error("Gagal menyimpan hak akses.");
      }
    }, 600);
  };

  // Delete custom role
  const handleDeleteRole = (role: Role) => {
    modal.confirm({
      title: "Hapus Role",
      content: `Apakah Anda yakin ingin menghapus role kustom '${role.name}'? Pengguna dengan role ini tidak akan memiliki hak akses lagi sampai role mereka diubah.`,
      okText: "Ya, Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk: () => {
        const success = roleService.deleteRole(role.code);
        if (success) {
          message.success(`Role '${role.name}' berhasil dihapus.`);
          loadRolesData();
        } else {
          message.error("Gagal menghapus role.");
        }
      }
    });
  };

  // Create new role
  const handleCreateRole = (values: any) => {
    const newRole: Role = {
      code: values.code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: values.name,
      description: values.description || "",
      isSystem: false
    };

    // Check if role code already exists
    if (roles.some(r => r.code === newRole.code)) {
      message.error(`Kode role '${newRole.code}' sudah digunakan! Gunakan kode lain.`);
      return;
    }

    // Load template permissions
    let initialPermissions: string[] = [];
    if (values.copyFrom) {
      initialPermissions = roleService.getRolePermissions(values.copyFrom);
    }

    const success = roleService.saveRole(newRole, initialPermissions);
    if (success) {
      message.success(`Role '${newRole.name}' berhasil dibuat!`);
      setIsModalOpen(false);
      form.resetFields();
      
      // Reload and select new role
      const fetchedRoles = roleService.getRoles();
      setRoles(fetchedRoles);
      const createdRole = fetchedRoles.find(r => r.code === newRole.code);
      if (createdRole) {
        handleSelectRole(createdRole);
      }
    } else {
      message.error("Gagal membuat role baru.");
    }
  };

  // Auto-fill role code from name in modal
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const code = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    form.setFieldsValue({ code });
  };

  // Group permissions by module
  const permissionsByModule = ALL_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isAdmin === null) {
    return null; // Loading state
  }

  if (isAdmin === false) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <Result
          status="403"
          title="Akses Ditolak"
          subTitle="Maaf, halaman pengaturan role dan hak akses hanya dapat diakses oleh Administrator."
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push("/antrean")}>
              Kembali ke Beranda
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>

      <div style={{ marginBottom: 20 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
              <SafetyCertificateOutlined style={{ color: "#1890ff" }} />
              Kelola Role & Hak Akses
            </Title>
            <Text type="secondary">
              Atur matrik izin akses pengguna berdasarkan peran masing-masing di rumah sakit.
            </Text>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Panel - Role List */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>Daftar Role</span>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Tambah
                </Button>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, height: "100%", minHeight: 450, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          >
            <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {roles.map((role) => {
                const isSelected = selectedRole?.code === role.code;
                return (
                  <div
                    key={role.code}
                    onClick={() => handleSelectRole(role)}
                    style={{
                      cursor: "pointer",
                      padding: "12px 16px",
                      borderRadius: 8,
                      backgroundColor: isSelected ? "rgba(24, 144, 255, 0.08)" : "transparent",
                      border: isSelected ? "1px solid rgba(24, 144, 255, 0.3)" : "1px solid rgba(0, 0, 0, 0.05)",
                      transition: "all 0.3s ease",
                      display: "block"
                    }}
                    className="role-list-item"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ color: isSelected ? "#1890ff" : "inherit" }}>
                        {role.name}
                      </Text>
                      {role.isSystem ? (
                        <Badge count="Sistem" style={{ backgroundColor: "#8c8c8c", fontSize: 10 }} />
                      ) : (
                        <Badge count="Kustom" style={{ backgroundColor: "#52c41a", fontSize: 10 }} />
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
                      <Paragraph ellipsis={{ rows: 1 }} type="secondary" style={{ margin: 0, fontSize: 12, maxWidth: "80%" }}>
                        {role.description || "Tidak ada deskripsi."}
                      </Paragraph>
                      {!role.isSystem && (
                        <Tooltip title="Hapus Role">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role);
                            }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right Panel - Permissions Configuration */}
        <Col xs={24} md={16}>
          {selectedRole ? (
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Space align="baseline">
                      <span style={{ fontWeight: 600, fontSize: 16 }}>Matrik Hak Akses:</span>
                      <Text strong style={{ color: "#1890ff" }}>{selectedRole.name}</Text>
                      <Text type="secondary" code style={{ fontSize: 12 }}>{selectedRole.code}</Text>
                    </Space>
                  </div>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSavePermissions}
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              }
              variant="borderless"
              style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
            >
              {selectedRole.isSystem && selectedRole.code === "admin" && (
                <div style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(24, 144, 255, 0.05)",
                  border: "1px solid rgba(24, 144, 255, 0.2)",
                  borderRadius: 8,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                  <InfoCircleOutlined style={{ color: "#1890ff" }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Role <strong>Administrator</strong> adalah role sistem utama. Hak akses penuh selalu diaktifkan secara otomatis.
                  </Text>
                </div>
              )}
              
              <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
                {selectedRole.description}
              </Text>

              {Object.entries(permissionsByModule).map(([moduleName, permissions]) => {
                const modulePermissionCodes = permissions.map(p => p.code);
                const isAllSelected = modulePermissionCodes.every(code => activePermissions.includes(code));
                const isSomeSelected = modulePermissionCodes.some(code => activePermissions.includes(code)) && !isAllSelected;
                
                return (
                  <div key={moduleName} style={{ marginBottom: 24 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      padding: "8px 16px",
                      borderRadius: 6,
                      marginBottom: 12
                    }}>
                      <Text strong style={{ fontSize: 14 }}>{moduleName}</Text>
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        disabled={selectedRole.code === "admin"}
                        onChange={(e) => handleToggleModuleAll(moduleName, e.target.checked)}
                      >
                        Pilih Semua
                      </Checkbox>
                    </div>

                    <Row gutter={[16, 16]}>
                      {permissions.map((permission) => {
                        const isGranted = activePermissions.includes(permission.code) || selectedRole.code === "admin";
                        return (
                          <Col key={permission.code} xs={24} sm={12}>
                            <Card
                              size="small"
                              style={{
                                border: isGranted ? "1px solid rgba(24, 144, 255, 0.2)" : "1px solid rgba(0,0,0,0.06)",
                                borderRadius: 8,
                                transition: "all 0.3s ease",
                                background: isGranted ? "rgba(24, 144, 255, 0.01)" : "transparent"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                  <Text strong style={{ fontSize: 13, display: "block", color: isGranted ? "#1890ff" : "inherit" }}>
                                    {permission.name}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2, lineHeight: 1.3 }}>
                                    {permission.description}
                                  </Text>
                                </div>
                                <Switch
                                  size="small"
                                  checked={isGranted}
                                  disabled={selectedRole.code === "admin"}
                                  onChange={(checked) => handleTogglePermission(permission.code, checked)}
                                />
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                );
              })}
              
              <Divider />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSavePermissions}
                  size="large"
                >
                  Simpan Hak Akses
                </Button>
              </div>
            </Card>
          ) : (
            <Card style={{ borderRadius: 12, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Result
                title="Pilih Role"
                subTitle="Silakan pilih salah satu role di panel kiri untuk melihat dan merubah hak akses."
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal - Tambah Role Baru */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyOutlined style={{ color: "#1890ff" }} />
            <span>Tambah Role Kustom Baru</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRole}
          initialValues={{ copyFrom: "dokter" }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nama Role"
            name="name"
            rules={[
              { required: true, message: "Nama role wajib diisi!" },
              { min: 3, message: "Nama role minimal 3 karakter!" }
            ]}
          >
            <Input
              prefix={<FormOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
              placeholder="Contoh: Perawat Senior, Kasir Poli"
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            label="Kode Role (Auto-Generated)"
            name="code"
            rules={[
              { required: true, message: "Kode role wajib diisi!" },
              { pattern: /^[a-z0-9_]+$/, message: "Hanya boleh huruf kecil, angka, dan underscore!" }
            ]}
            extra="Kode unik ini digunakan secara internal di sistem (contoh: perawat_senior)."
          >
            <Input
              prefix={<KeyOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
              placeholder="Contoh: perawat_senior"
            />
          </Form.Item>

          <Form.Item
            label="Deskripsi Peran"
            name="description"
            rules={[{ required: true, message: "Silakan masukkan deskripsi singkat mengenai role ini!" }]}
          >
            <TextArea
              rows={3}
              placeholder="Jelaskan secara singkat tanggung jawab atau fungsi dari role ini..."
            />
          </Form.Item>

          <Form.Item
            label="Salin Templat Hak Akses Dari"
            name="copyFrom"
            extra="Pilih role yang ada sebagai templat hak akses awal untuk role baru ini."
          >
            <Select prefix={<CopyOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}>
              {roles.map(r => (
                <Option key={r.code} value={r.code}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}>
                Batal
              </Button>
              <Button type="primary" htmlType="submit">
                Buat Role Baru
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
