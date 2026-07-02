"use client";

import React, { useState, useEffect } from "react";
import {
  Form, Input, Button, Card, Typography, Select, Breadcrumb, App, Result
} from "antd";
import {
  UserAddOutlined, ArrowLeftOutlined, KeyOutlined,
  UserOutlined, IdcardOutlined, SecurityScanOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getUser, registerGateway } from "../../../lib/api";

const { Title, Text } = Typography;
const { Option } = Select;

export default function RegisterUserPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const user = getUser();
    if (user && user.role === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await registerGateway({
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role,
      });

      if (res.status) {
        message.success(`User '${values.username}' berhasil didaftarkan!`);
        form.resetFields();
      } else {
        message.error(res.message || "Gagal mendaftarkan user.");
      }
    } catch (err: any) {
      message.error(err.message || "Gagal menghubungi Auth Service.");
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) {
    return null; // Loading state
  }

  if (isAdmin === false) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <Result
          status="403"
          title="Akses Ditolak"
          subTitle="Maaf, halaman registrasi pengguna baru hanya dapat diakses oleh Administrator."
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

      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserAddOutlined style={{ color: "var(--primary-color)" }} />
              <span>Registrasi Pengguna Baru</span>
            </div>
          }
          variant="borderless"
          style={{ width: "100%", maxWidth: 500, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ role: "apoteker" }}
          >
            <Form.Item
              label="Nama Lengkap"
              name="name"
              rules={[{ required: true, message: "Nama lengkap wajib diisi!" }]}
            >
              <Input prefix={<IdcardOutlined style={{ color: "rgba(0,0,0,0.25)" }} />} placeholder="Masukkan nama lengkap user..." />
            </Form.Item>

            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Username wajib diisi!" },
                { min: 3, message: "Username minimal 3 karakter!" }
              ]}
            >
              <Input prefix={<UserOutlined style={{ color: "rgba(0,0,0,0.25)" }} />} placeholder="Masukkan username unik..." />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password wajib diisi!" },
                { min: 6, message: "Password minimal 6 karakter!" }
              ]}
            >
              <Input.Password prefix={<KeyOutlined style={{ color: "rgba(0,0,0,0.25)" }} />} placeholder="Masukkan password user..." />
            </Form.Item>

            <Form.Item
              label="Hak Akses (Role)"
              name="role"
              rules={[{ required: true, message: "Silakan pilih hak akses role!" }]}
            >
              <Select prefix={<SecurityScanOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}>
                <Option value="admin">Administrator</Option>
                <Option value="apoteker">Apoteker / Farmasi</Option>
                <Option value="dokter">Dokter Medis</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Daftarkan User Baru
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
