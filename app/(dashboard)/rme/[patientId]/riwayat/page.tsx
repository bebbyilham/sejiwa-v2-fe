"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Timeline, Typography, Tag, Space, Row, Col, Divider, Alert } from "antd";
import { HistoryOutlined, CalendarOutlined, FileTextOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

interface HistoryRecord {
  key: string;
  date: string;
  poli: string;
  doctor: string;
  diagnoses: string[];
  subjektif: string;
  objektif: string;
  plan_notes: string;
  medications?: Array<{ name: string; dose: string; frequency: string; qty: number }>;
  tindakan?: string[];
}

export default function RiwayatPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);

  // Empty past records to remove dummy data
  const pastRecords: HistoryRecord[] = [];

  useEffect(() => {
    // Check if there is a newly saved SOAP record for this patient in localStorage
    const savedSoapRaw = localStorage.getItem(`soap_${patientId}`);
    let fullHistory = [...pastRecords];

    if (savedSoapRaw) {
      const savedSoap = JSON.parse(savedSoapRaw);
      
      const todayStr = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }) + " (Hari Ini)";

      const newRecord: HistoryRecord = {
        key: "visit_latest",
        date: todayStr,
        poli: "Poli Penyakit Dalam (INT)",
        doctor: "Dr. Jhon Doe, Sp.PD",
        diagnoses: savedSoap.diagnoses || [],
        subjektif: savedSoap.subjektif || "-",
        objektif: savedSoap.objektif || "-",
        plan_notes: savedSoap.plan_notes || "-",
        medications: savedSoap.medications || [],
        tindakan: savedSoap.selectedTindakan || []
      };

      // Add to beginning of array
      fullHistory = [newRecord, ...fullHistory];
    }

    setHistoryData(fullHistory);
  }, [patientId]);

  // Expandable row rendering
  const expandableRowRender = (record: HistoryRecord) => {
    return (
      <Card
        size="small"
        style={{
          backgroundColor: "#fafafa",
          border: "1px solid #d9d9d9",
          borderRadius: 8,
          margin: "8px 0"
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Title level={5} style={{ fontSize: 13, marginBottom: 6, color: "#1890ff" }}>
              <FileTextOutlined /> Subjektif (S)
            </Title>
            <Paragraph style={{ fontSize: 13, color: "rgba(0,0,0,0.85)" }}>
              {record.subjektif}
            </Paragraph>

            <Divider style={{ margin: "10px 0" }} />

            <Title level={5} style={{ fontSize: 13, marginBottom: 6, color: "#1890ff" }}>
              <FileTextOutlined /> Objektif (O)
            </Title>
            <Paragraph style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "rgba(0,0,0,0.85)" }}>
              {record.objektif}
            </Paragraph>
          </Col>

          <Col xs={24} md={12}>
            <Title level={5} style={{ fontSize: 13, marginBottom: 6, color: "#1890ff" }}>
              <MedicineBoxOutlined /> Plan (P) - E-Resep & Tindakan
            </Title>
            
            {record.medications && record.medications.length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12 }}>Resep Obat:</Text>
                <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: 13 }}>
                  {record.medications.map((med, idx) => (
                    <li key={idx}>
                      <strong>{med.name}</strong> - {med.dose} ({med.frequency}) | Qty: {med.qty}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Tidak ada resep obat.</Text>
            )}

            {record.tindakan && record.tindakan.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12, marginRight: 8 }}>Tindakan Medis:</Text>
                {record.tindakan.map((t) => (
                  <Tag color="blue" key={t}>{t}</Tag>
                ))}
              </div>
            )}

            <Text strong style={{ fontSize: 12 }}>Catatan Rencana Lanjutan:</Text>
            <Paragraph style={{ fontSize: 13, color: "rgba(0,0,0,0.85)", marginTop: 4 }}>
              {record.plan_notes}
            </Paragraph>
          </Col>
        </Row>
      </Card>
    );
  };

  const columns = [
    {
      title: "Tanggal Kunjungan",
      dataIndex: "date",
      key: "date",
      width: 180,
      render: (text: string) => (
        <Space>
          <CalendarOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: "Poliklinik",
      dataIndex: "poli",
      key: "poli",
      width: 180,
      render: (text: string) => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: "Dokter Pemeriksa",
      dataIndex: "doctor",
      key: "doctor",
      width: 180,
    },
    {
      title: "Diagnosa Utama (ICD-10)",
      dataIndex: "diagnoses",
      key: "diagnoses",
      render: (diagnoses: string[]) => (
        <Space size={[0, 4]} wrap>
          {diagnoses.length === 0 ? (
            <Text type="secondary">-</Text>
          ) : (
            diagnoses.map((diag) => (
              <Tag color="volcano" key={diag}>{diag}</Tag>
            ))
          )}
        </Space>
      )
    }
  ];

  // Visual Timeline events mapping
  const timelineItems = historyData.map((record) => ({
    color: record.key === "visit_latest" ? "green" : "blue",
    children: (
      <div>
        <Text strong style={{ fontSize: 13 }}>{record.date}</Text>
        <br />
        <Text style={{ fontSize: 12 }} type="secondary">{record.poli} - {record.doctor}</Text>
        <div style={{ marginTop: 4 }}>
          {record.diagnoses.map((d) => (
            <Tag color="volcano" key={d} style={{ fontSize: 10, padding: "0 4px" }}>{d.split(" ")[0]}</Tag>
          ))}
        </div>
      </div>
    )
  }));

  return (
    <div style={{ paddingBottom: 40 }}>
      <Row gutter={[24, 24]}>
        {/* Left Side: Table of visits */}
        <Col xs={24} lg={18}>
          <Card
            title={<strong><HistoryOutlined style={{ color: "#1890ff", marginRight: 8 }} />Tabel Riwayat Medis</strong>}
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <Alert
              title="Tips Dokter"
              description="Klik baris riwayat kunjungan di bawah untuk melebarkan (expand) dan melihat detail SOAP lengkap, resep e-resep, dan tindakan yang diberikan pada kunjungan tersebut."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={historyData}
              columns={columns}
              expandable={{
                expandedRowRender: expandableRowRender,
                defaultExpandAllRows: true, // Auto expand rows for easy readability
              }}
              pagination={{ pageSize: 5 }}
              style={{ overflowX: "auto" }}
            />
          </Card>
        </Col>

        {/* Right Side: Timeline graph */}
        <Col xs={24} lg={6}>
          <Card
            title={<strong>Timeline Kunjungan</strong>}
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", height: "100%" }}
          >
            <Timeline items={timelineItems} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
