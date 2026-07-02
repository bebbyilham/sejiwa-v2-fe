"use client";

import React, { useState, useEffect } from "react";
import { Card, Space, Tag, Typography, Button, Spin, Row, Col, Tabs, App } from "antd";
import {
  UserOutlined, IdcardOutlined, CalendarOutlined, AlertOutlined,
  ArrowLeftOutlined, CopyOutlined
} from "@ant-design/icons";
import { useRouter, usePathname, useParams } from "next/navigation";
import { apiRequest } from "../../../lib/api";

const { Text, Title } = Typography;

interface PatientDetail {
  no_mr: string;
  nama_pasien: string;
  tanggal_lahir: string;
  jenis_kelamin: number;
  no_bpjs: string;
  nomor_pengenal: string;
  gol_darah?: string;
  alergi?: string;
}

export default function RmePatientLayout({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
    const fetchPatientDetail = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`pasien/detail/${patientId}`);
        if (res.status) {
          setPatient(res.data);
        }
      } catch (e) {
        console.error("Gagal memuat detail pasien: ", e);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientDetail();
    }
  }, [patientId]);

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "";
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age + " Thn";
  };

  const getActiveTabKey = () => {
    if (pathname.includes("/asesmen")) return "asesmen";
    if (pathname.includes("/soap")) return "soap";
    if (pathname.includes("/riwayat")) return "riwayat";
    return "asesmen";
  };

  const handleTabChange = (key: string) => {
    router.push(`/rme/${patientId}/${key}`);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" description="Memuat Detail Rekam Medis Pasien..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card style={{ margin: "24px 0", borderRadius: 12, textAlign: "center" }}>
        <AlertOutlined style={{ fontSize: 48, color: "#cf1322", marginBottom: 16 }} />
        <Title level={4}>Data Pasien Tidak Ditemukan</Title>
        <Text type="secondary">Pasien dengan Nomor Rekam Medis &quot;{patientId}&quot; tidak ada di database.</Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" onClick={() => router.push("/antrean")}>Kembali ke Antrean</Button>
        </div>
      </Card>
    );
  }

  // Active tabs definition
  const tabItems = [
    { key: "asesmen", label: "Asesmen Keperawatan" },
    { key: "soap", label: "SOAP Dokter" },
    { key: "riwayat", label: "Riwayat Kunjungan & Dokumen" },
  ];

  return (
    <div>
      {/* Sticky Patient Banner */}
      <div
        className="sticky-patient-banner"
        style={{
          margin: isMobile ? "0 -12px 16px -12px" : "0 -24px 20px -24px",
          padding: isMobile ? "10px 14px 6px 14px" : "12px 24px",
          position: "sticky",
          top: 64,
          zIndex: 999,
        }}
      >
        {isMobile ? (
          /* Mobile layout */
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/antrean")}
                  shape="circle"
                  size="small"
                  style={{ border: "1px solid rgba(0, 0, 0, 0.15)", flexShrink: 0 }}
                />
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1890ff", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {patient.nama_pasien}
                </Title>
              </div>
              <Tag color="geekblue" style={{ fontSize: 11, padding: "1px 6px", margin: 0, flexShrink: 0 }}>
                RM: {patient.no_mr}
              </Tag>
            </div>
            
            <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
              <Tag color={patient.jenis_kelamin === 1 ? "blue" : "magenta"} style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>
                {patient.jenis_kelamin === 1 ? "L" : "P"}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {calculateAge(patient.tanggal_lahir)}
              </Text>
              <span style={{ color: "rgba(0,0,0,0.15)" }}>|</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Gol: <strong style={{ color: "#cf1322" }}>{patient.gol_darah || "-"}</strong>
              </Text>
              <span style={{ color: "rgba(0,0,0,0.15)" }}>|</span>
              <Text type="secondary" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                BPJS: {patient.no_bpjs && patient.no_bpjs !== "NULL" ? patient.no_bpjs : "-"}
              </Text>
            </div>

            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              {patient.alergi && patient.alergi !== "Tidak Ada" && patient.alergi !== "Tidak Ada Alergi" ? (
                <Tag
                  color="red"
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: 600,
                    border: "1px solid #ffccc7",
                    margin: 0,
                    whiteSpace: "normal",
                    wordBreak: "break-word"
                  }}
                >
                  ⚠️ ALERGI: {patient.alergi.toUpperCase()}
                </Tag>
              ) : (
                <Tag color="green" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, margin: 0 }}>
                  ✓ TIDAK ADA ALERGI
                </Tag>
              )}
              <Button icon={<CopyOutlined />} size="small" style={{ fontSize: 11, padding: "0 8px" }} onClick={() => {
                navigator.clipboard.writeText(patient.no_mr);
                message.success("Nomor RM berhasil disalin!");
              }}>
                Salin
              </Button>
            </div>
          </div>
        ) : (
          /* Desktop/Tablet layout */
          <Row justify="space-between" align="middle" gutter={[12, 12]}>
            <Col xs={24} md={16}>
              <Space size="large" style={{ display: "flex", flexWrap: "wrap" }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/antrean")}
                  shape="circle"
                  style={{ border: "1px solid #d9d9d9" }}
                />
                <div>
                  <Space>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1890ff" }}>
                      {patient.nama_pasien}
                    </Title>
                    <Tag color="geekblue" style={{ fontSize: 13, padding: "2px 8px" }}>
                      RM: {patient.no_mr}
                    </Tag>
                    <Tag color={patient.jenis_kelamin === 1 ? "blue" : "magenta"}>
                      {patient.jenis_kelamin === 1 ? "Laki-laki" : "Perempuan"}
                    </Tag>
                  </Space>
                  <div style={{ marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                    <Text type="secondary">
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {patient.tanggal_lahir} ({calculateAge(patient.tanggal_lahir)})
                    </Text>
                    <Text type="secondary">
                      <IdcardOutlined style={{ marginRight: 4 }} />
                      BPJS: {patient.no_bpjs && patient.no_bpjs !== "NULL" ? patient.no_bpjs : "-"}
                    </Text>
                    <Text type="secondary">
                      Gol. Darah: <strong style={{ color: "#cf1322" }}>{patient.gol_darah || "-"}</strong>
                    </Text>
                  </div>
                </div>
              </Space>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <Space style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                {patient.alergi && patient.alergi !== "Tidak Ada" && patient.alergi !== "Tidak Ada Alergi" ? (
                  <Tag
                    color="red"
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontWeight: 600,
                      border: "2px solid #ffccc7",
                      boxShadow: "0 2px 4px rgba(255, 77, 79, 0.1)",
                    }}
                  >
                    ⚠️ ALERGI: {patient.alergi.toUpperCase()}
                  </Tag>
                ) : (
                  <Tag
                    color="green"
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    ✓ TIDAK ADA ALERGI
                  </Tag>
                )}
                <Button icon={<CopyOutlined />} size="small" onClick={() => {
                  navigator.clipboard.writeText(patient.no_mr);
                  message.success("Nomor RM berhasil disalin!");
                }}>
                  Salin RM
                </Button>
              </Space>
            </Col>
          </Row>
        )}

        {/* Tab Navigation */}
        <div style={{ marginTop: isMobile ? 8 : 12, marginBottom: -12 }}>
          <Tabs
            activeKey={getActiveTabKey()}
            onChange={handleTabChange}
            items={tabItems}
            tabBarStyle={{ marginBottom: 0 }}
            size={isMobile ? "small" : "middle"}
          />
        </div>
      </div>

      {/* RME Child Pages render area */}
      <div style={{ marginTop: 8 }}>
        {children}
      </div>
    </div>
  );
}
