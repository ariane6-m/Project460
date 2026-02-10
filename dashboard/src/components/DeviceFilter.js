import React, { useState, useEffect } from 'react';

const DeviceFilter = ({ devices, onFilterChange }) => {
  const [filters, setFilters] = useState({
    type: '',
    vendor: '',
    ipRange: '',
  });

  // Extract unique values for filter options
  useEffect(() => {
    if (devices && devices.length > 0) {
      onFilterChange(applyFilters(devices, filters));
    }
  }, [filters]);

  const applyFilters = (deviceList, filterCriteria) => {
    return deviceList.filter((device) => {
      // Filter by type
      if (filterCriteria.type && device.type !== filterCriteria.type) {
        return false;
      }

      // Filter by vendor
      if (filterCriteria.vendor && device.vendor !== filterCriteria.vendor) {
        return false;
      }

      // Filter by IP range
      if (filterCriteria.ipRange) {
        if (!isIPInRange(device.ip, filterCriteria.ipRange)) {
          return false;
        }
      }

      return true;
    });
  };

  const isIPInRange = (ip, range) => {
    // Handle CIDR notation (e.g., 192.168.1.0/24)
    if (range.includes('/')) {
      return cidrMatch(ip, range);
    }
    // Handle simple IP matching
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      return compareIPs(ip, start) >= 0 && compareIPs(ip, end) <= 0;
    }
    // Exact IP match
    return ip === range;
  };

  const cidrMatch = (ip, cidr) => {
    const [network, bits] = cidr.split('/');
    const mask = createMask(parseInt(bits, 10));
    return applyMask(ip, mask) === applyMask(network, mask);
  };

  const createMask = (bits) => {
    return ((0xffffffff << (32 - bits)) >>> 0).toString(16);
  };

  const applyMask = (ip, mask) => {
    const parts = ip.split('.').map((part) => parseInt(part, 10));
    const value = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    return value.toString(16);
  };

  const compareIPs = (ip1, ip2) => {
    const parts1 = ip1.split('.').map(Number);
    const parts2 = ip2.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      if (parts1[i] < parts2[i]) return -1;
      if (parts1[i] > parts2[i]) return 1;
    }
    return 0;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
      type: '',
      vendor: '',
      ipRange: '',
    });
  };

  // Get unique values for dropdowns
  const uniqueTypes = devices
    ? [...new Set(devices.map((d) => d.type).filter(Boolean))]
    : [];
  const uniqueVendors = devices
    ? [...new Set(devices.map((d) => d.vendor).filter(Boolean))]
    : [];

  return (
    <div className="device-filter">
      <h3>Filter Devices</h3>
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="type-filter">Device Type</label>
          <select
            id="type-filter"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="vendor-filter">Vendor</label>
          <select
            id="vendor-filter"
            name="vendor"
            value={filters.vendor}
            onChange={handleFilterChange}
          >
            <option value="">All Vendors</option>
            {uniqueVendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="ip-filter">IP Range (e.g., 192.168.1.0/24)</label>
          <input
            id="ip-filter"
            type="text"
            name="ipRange"
            value={filters.ipRange}
            onChange={handleFilterChange}
            placeholder="192.168.1.0/24 or 192.168.1.1-192.168.1.100"
          />
        </div>

        <button className="reset-button" onClick={handleReset}>
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default DeviceFilter;
