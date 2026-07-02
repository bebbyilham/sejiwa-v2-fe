"use client";

import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Table, Tag, Button, Space, Typography,
  Breadcrumb, Divider, App, Spin, Result, Avatar
} from "antd";
import {
  MedicineBoxOutlined, UserOutlined, CalendarOutlined,
  CheckCircleOutlined, ArrowLeftOutlined, LoadingOutlined,
  FileTextOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "../../../../../lib/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface ResepInfo {
  id_pasien_resep: number;
  nomor_resep: string;
  tgl_resep: string;
  catatan_resep: string | null;
  diagnosa_resep: string | null;
  layanan: number;
  apotik_online: number;
  no_mr: string;
  nama_pasien: string;
  jenis_kelamin: number;
  tanggal_lahir: string;
  nama_dokter: string;
  nama_poli: string | null;
  nama_ruangan_ranap: string | null;
  ut: number;
  ub: number;
  nosep: string | null;
}

interface MedicineItem {
  id: number;
  nama_obat: string | null;
  nama_racikan: string | null;
  kode_racikan: string | null;
  jumlah: number;
  dosis: string | null;
  racikan: number;
  catatan_obat: string | null;
  deskripsi_satuan_barang: string | null;
  nama_signa: string | null;
  keterangan_obat: string | null;
  ket_route: string | null;
}

export default function ProsesResepPage() {
  const params = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const resepId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [resepInfo, setResepInfo] = useState<ResepInfo | null>(null);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`farmasibpjs/resep/detail/${resepId}`);
      if (res.status && res.data) {
        setResepInfo(res.data.resep);
        setMedicines(res.data.medicines);
      } else {
        message.error("Resep tidak ditemukan.");
      }
    } catch (e: any) {
      message.error("Gagal mengambil detail resep: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resepId) {
      fetchDetail();
    }
  }, [resepId]);

  const handleFinalize = async () => {
    if (!resepInfo) return;
    setSubmitLoading(true);
    try {
      const res = await apiRequest("farmasibpjs/resep/final", {
        method: "POST",
        body: JSON.stringify({ id_pasien_resep: resepInfo.id_pasien_resep }),
      });
      if (res.status) {
        message.success("Resep berhasil difinalkan dan ditandai selesai.");
        router.push("/farmasibpjs/daftarresep");
      } else {
        message.error(res.message || "Gagal memfinalkan resep.");
      }
    } catch (e: any) {
      message.error("Gagal memproses aksi: " + e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <Spin size="large" description="Memuat detail resep..." />
      </div>
    );
  }

  if (!resepInfo) {
    return (
      <Result
        status="warning"
        title="Resep Tidak Ditemukan"
        subTitle="Data resep tidak ditemukan di database."
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push("/farmasibpjs/daftarresep")}>
            Kembali ke Daftar Resep
          </Button>
        }
      />
    );
  }

  const columns = [
    {
      title: "No",
      key: "index",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Nama Obat",
      key: "nama_obat",
      render: (_: any, record: MedicineItem) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {record.nama_obat || "Obat Racikan"}
          </Text>
          {record.racikan === 1 && (
            <div style={{ marginTop: 2 }}>
              <Tag color="purple">Racikan: {record.nama_racikan || "-"}</Tag>
              {record.kode_racikan && <Tag color="pink">{record.kode_racikan}</Tag>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Aturan Pakai (Signa)",
      key: "aturan_pakai",
      render: (_: any, record: MedicineItem) => (
        <Space orientation="vertical" size={1}>
          <Text>{record.nama_signa || "-"}</Text>
          {record.dosis && <Text type="secondary" style={{ fontSize: 11 }}>Dosis: {record.dosis}</Text>}
          {record.ket_route && <Tag style={{ fontSize: 10 }}>Route: {record.ket_route}</Tag>}
          {record.keterangan_obat && <Text style={{ fontSize: 11 }} italic>{record.keterangan_obat}</Text>}
        </Space>
      ),
    },
    {
      title: "Jumlah",
      key: "jumlah",
      width: 120,
      render: (_: any, record: MedicineItem) => (
        <Text strong>
          {record.jumlah} {record.deskripsi_satuan_barang || "PCS"}
        </Text>
      ),
    },
    {
      title: "Catatan",
      dataIndex: "catatan_obat",
      key: "catatan_obat",
      render: (text: string) => text || "-",
    },
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: "Farmasi BPJS" },
          { title: "Daftar Resep", href: "/farmasibpjs/daftarresep" },
          { title: "Proses Resep" }
        ]}
      />

      <Row gutter={[16, 16]}>
        {/* Left Column - Patient & Resep Profile */}
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          >
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: "var(--primary-color)", marginBottom: 12 }} />
              <Title level={4} style={{ margin: 0 }}>
                {resepInfo.nama_pasien.toUpperCase()}
              </Title>
              <Text type="secondary">
                {resepInfo.jenis_kelamin === 1 ? "Laki-laki" : "Perempuan"} | {resepInfo.ut} Th, {resepInfo.ub} Bln
              </Text>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>No. RM / No. MR</Text>
                <br />
                <Text strong>{resepInfo.no_mr}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>No. Resep</Text>
                <br />
                <Text strong style={{ color: "var(--primary-color)" }}>{resepInfo.nomor_resep}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Layanan / Poliklinik</Text>
                <br />
                <Tag color={resepInfo.layanan === 1 ? "purple" : "cyan"}>
                  {resepInfo.layanan === 1 ? resepInfo.nama_ruangan_ranap || "Rawat Inap" : resepInfo.nama_poli || "Rawat Jalan"}
                </Tag>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Dokter Pengirim</Text>
                <br />
                <Text strong>{resepInfo.nama_dokter}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>No. SEP (Jaminan JKN)</Text>
                <br />
                <Tag color="blue">{resepInfo.nosep || "-"}</Tag>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Tanggal Resep</Text>
                <br />
                <Text strong>{dayjs(resepInfo.tgl_resep).format("DD-MM-YYYY")}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Diagnosa Medis</Text>
                <br />
                <Text>{resepInfo.diagnosa_resep || "-"}</Text>
              </div>
            </div>

            <Divider style={{ margin: "20px 0" }} />

            <Space orientation="vertical" style={{ width: "100%" }} size="middle">
              {resepInfo.apotik_online !== 1 ? (
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={submitLoading ? <LoadingOutlined /> : <CheckCircleOutlined />}
                  onClick={handleFinalize}
                  loading={submitLoading}
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                >
                  Finalkan Resep
                </Button>
              ) : (
                <Tag color="green" style={{ width: "100%", textAlign: "center", padding: "8px", fontSize: 14 }}>
                  <CheckCircleOutlined /> RESEP SELESAI INPUT
                </Tag>
              )}

              <Button
                block
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/farmasibpjs/daftarresep")}
                disabled={submitLoading}
              >
                Kembali
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Right Column - Medicine List */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MedicineBoxOutlined style={{ color: "var(--primary-color)" }} />
                <span>Rincian Obat Dokter</span>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          >
            <Table
              dataSource={medicines}
              columns={columns}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "Tidak ada obat dalam resep ini" }}
              style={{ overflowX: "auto" }}
            />

            {resepInfo.catatan_resep && (
              <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: "#f9f9f9", borderRadius: 8, borderLeft: "4px solid var(--primary-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <InfoCircleOutlined style={{ color: "var(--primary-color)" }} />
                  <Text strong>Catatan Dokter:</Text>
                </div>
                <Paragraph style={{ margin: 0 }}>{resepInfo.catatan_resep}</Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
