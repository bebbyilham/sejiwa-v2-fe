"use client";

import React, { useState, useEffect } from "react";
import {
  Card, Table, Tag, DatePicker, Select, Button, Space, Typography,
  App, Row, Col
} from "antd";
import {
  BarChartOutlined, SearchOutlined, CheckCircleOutlined, InfoCircleOutlined
} from "@ant-design/icons";
import { apiRequest } from "../../../lib/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function MonitoringKlaimPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [selectedJenis, setSelectedJenis] = useState<string>("0"); // 0=Apotek, 1=RS

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`farmasibpjs/monitoring?tanggal=${selectedDate}&jenis=${selectedJenis}`);
      if (res.status && res.data && res.data.list) {
        setData(res.data.list);
      } else {
        setData([]);
        message.info(res.message || "Data monitoring klaim tidak ditemukan");
      }
    } catch (e: any) {
      message.error("Gagal memuat monitoring klaim: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [selectedDate, selectedJenis]);

  const columns = [
    {
      title: "No",
      key: "index",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "No. SEP",
      dataIndex: "noSEP",
      key: "noSEP",
      width: 180,
      render: (text: string) => <Tag color="blue">{text || "-"}</Tag>,
    },
    {
      title: "No. Kartu",
      dataIndex: "noKartu",
      key: "noKartu",
      width: 150,
    },
    {
      title: "Nama Pasien",
      dataIndex: "nama",
      key: "nama",
      width: 200,
      render: (text: string) => <strong>{text ? text.toUpperCase() : "-"}</strong>,
    },
    {
      title: "No. Resep",
      dataIndex: "noResep",
      key: "noResep",
      width: 180,
      render: (text: string) => text || "-",
    },
    {
      title: "Tanggal Entry",
      dataIndex: "tglEntry",
      key: "tglEntry",
      width: 120,
      render: (text: string) => text ? dayjs(text).format("DD-MM-YYYY") : "-",
    },
    {
      title: "Status Klaim",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (text: string) => {
        const isSuccess = text && (text.toLowerCase().includes("sukses") || text.toLowerCase().includes("layani") || text.toLowerCase().includes("final"));
        return (
          <Tag color={isSuccess ? "green" : "warning"} icon={isSuccess ? <CheckCircleOutlined /> : <InfoCircleOutlined />}>
            {text || "PROSES"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title={
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            <BarChartOutlined style={{ marginRight: 8, color: "var(--primary-color)" }} />
            Monitoring Data Klaim BPJS
          </Title>
        }
        variant="borderless"
        style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 20, alignItems: "flex-end" }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Tanggal Entry:</Text>
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={(date) => {
                  if (date) setSelectedDate(date.format("YYYY-MM-DD"));
                }}
                allowClear={false}
                style={{ width: "100%" }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Text strong style={{ fontSize: 12 }}>Jenis Faskes:</Text>
              <Select value={selectedJenis} onChange={setSelectedJenis} style={{ width: "100%" }}>
                <Option value="0">Apotek / Depo</Option>
                <Option value="1">Rumah Sakit</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchMonitoringData}
              loading={loading}
              style={{ width: "100%" }}
            >
              Cari Data
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) => record.noSEP + record.noResep}
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{ overflowX: "auto" }}
        />
      </Card>
    </div>
  );
}
