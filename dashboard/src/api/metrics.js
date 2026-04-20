// dashboard/src/api/metrics.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
});

export const getOverview = async () => {
  const res = await api.get('/metrics');
  return res.data.data;
};

export const getRequestVolume = async (hours = 24) => {
  const res = await api.get(`/metrics/requests?hours=${hours}`);
  return res.data.data;
};

export const getAlgorithmStats = async () => {
  const res = await api.get('/metrics/algorithms');
  return res.data.data;
};

export const getTopUsers = async () => {
  const res = await api.get('/metrics/top-users');
  return res.data.data;
};

export const getBlockedStats = async () => {
  const res = await api.get('/metrics/blocked');
  return res.data.data;
};

export const getConfigs = async () => {
  const res = await api.get('/configs');
  return res.data.data;
};

export const getHealth = async () => {
  const res = await api.get('/health', { baseURL: '' });
  return res.data;
};