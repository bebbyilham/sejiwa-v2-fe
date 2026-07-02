"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  message,
  Typography,
  Alert,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getUser, updateProfileGateway, setSession } from "../../lib/api";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [user, setUser] = useState<{ username: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      form.setFieldsValue({
        name: currentUser.name,
        username: currentUser.username,
        role: currentUser.role,
      });
    }
  }, [form]);

  const handleUpdatePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Konfirmasi password baru tidak cocok!");
      return;
    }

    setLoading(true);
    try {
      const response = await updateProfileGateway({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response.status) {
        message.success(response.message || "Password berhasil diperbarui!");
        form.resetFields(["currentPassword", "newPassword", "confirmPassword"]);
        
        // Update session if token provided
        if (response.data && response.data.token && response.data.user) {
          setSession(response.data.token, response.data.user);
        }
      } else {
        message.error(response.message || "Gagal memperbarui password");
      }
    } catch (error: any) {
      message.error(error.message || "Terjadi kesalahan saat memperbarui password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          Profil Saya
        </Title>
        <Text type="secondary">Kelola informasi akun dan kata sandi Anda</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Kolom Info Profil */}
        <Col xs={24} md={10}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserOutlined style={{ color: "#1890ff" }} />
                <span>Informasi Profil</span>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%" }}
          >
            <Alert
              title="Data tidak dapat diubah"
              description="Silahkan lapor admin untuk mengubah data profil (Nama, Username, atau Role)."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 20, borderRadius: 8 }}
            />

            <Form layout="vertical" form={form}>
              <Form.Item label="Nama Lengkap" name="name">
                <Input disabled size="large" />
              </Form.Item>
              <Form.Item label="Username" name="username">
                <Input disabled size="large" />
              </Form.Item>
              <Form.Item label="Role Akses" name="role">
                <Input disabled size="large" style={{ textTransform: "capitalize" }} />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Kolom Ubah Password */}
        <Col xs={24} md={14}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LockOutlined style={{ color: "#1890ff" }} />
                <span>Ubah Password</span>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%" }}
          >
            <Form
              layout="vertical"
              onFinish={handleUpdatePassword}
              requiredMark="optional"
            >
              <Form.Item
                label="Password Saat Ini"
                name="currentPassword"
                rules={[{ required: true, message: "Mohon masukkan password saat ini" }]}
              >
                <Input.Password size="large" placeholder="Masukkan password saat ini" />
              </Form.Item>
              
              <Divider style={{ margin: "16px 0" }} />

              <Form.Item
                label="Password Baru"
                name="newPassword"
                rules={[
                  { required: true, message: "Mohon masukkan password baru" },
                  { min: 6, message: "Password minimal 6 karakter" }
                ]}
              >
                <Input.Password size="large" placeholder="Masukkan password baru" />
              </Form.Item>

              <Form.Item
                label="Konfirmasi Password Baru"
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Mohon konfirmasi password baru" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Konfirmasi password tidak cocok"));
                    },
                  }),
                ]}
              >
                <Input.Password size="large" placeholder="Ketik ulang password baru" />
              </Form.Item>

              <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={loading}
                  style={{ borderRadius: 8, padding: "0 24px", height: 44, fontWeight: 500 }}
                >
                  Simpan Password Baru
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
