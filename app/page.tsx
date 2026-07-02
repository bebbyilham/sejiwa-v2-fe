"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Alert, App, Tooltip } from "antd";
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { apiRequest, setSession, getUser, loginGateway } from "./lib/api";
import { useTheme } from "./lib/ThemeContext";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { message } = App.useApp();
  const { theme, toggleTheme } = useTheme();

  // Check if already logged in
  useEffect(() => {
    if (getUser()) {
      router.push("/antrean");
    }
  }, [router]);

  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginGateway(values.username, values.password);

      if (res.status && res.data) {
        setSession(res.data.token, res.data.user);
        message.success(`Selamat datang kembali, ${res.data.user.name}!`);
        router.push("/antrean");
      } else {
        setErrorMsg(res.message || "Login gagal. Silakan periksa kembali akun Anda.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Koneksi ke server gagal. Pastikan API Gateway aktif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        position: "relative",
        background: "transparent",
        overflow: "hidden"
      }}
    >
      {/* Floating Theme Toggle Button */}
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 100 }}>
        <Tooltip title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}>
          <Button
            type="text"
            shape="circle"
            size="large"
            icon={theme === "dark" ? <SunOutlined style={{ fontSize: 20, color: "#faad14" }} /> : <MoonOutlined style={{ fontSize: 20 }} />}
            onClick={toggleTheme}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(10px)",
              boxShadow: "var(--glass-shadow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          />
        </Tooltip>
      </div>

      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "var(--glass-shadow-hover)",
          zIndex: 10
        }}
        variant="borderless"
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(9, 109, 217, 0.2) 0%, rgba(9, 109, 217, 0.05) 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto 16px auto",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 8px 32px 0 rgba(9, 109, 217, 0.1)"
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 32, color: "var(--primary-color)" }} />
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "1px" }}>
            SEJIWA
          </Title>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
            Sistem Informasi Manajemen & RME
          </Text>
        </div>

        {errorMsg && (
          <Alert
            title="Gagal Masuk"
            description={errorMsg}
            type="error"
            showIcon
            style={{
              marginBottom: 24,
              borderRadius: 12
            }}
          />
        )}

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Silakan masukkan username Anda!" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "var(--text-secondary)", marginRight: 8, opacity: 0.7 }} />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Silakan masukkan password Anda!" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "var(--text-secondary)", marginRight: 8, opacity: 0.7 }} />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                borderRadius: 12,
                height: 48,
                fontWeight: 600,
                background: "var(--primary-color)",
                border: "none"
              }}
            >
              Masuk ke Dashboard
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
