import "./manageStatePage.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from "@clerk/clerk-react";

const ManageStatePage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estate Management State
  const [estates, setEstates] = useState([]);
  const [selectedEstate, setSelectedEstate] = useState('');
  const [isAddingEstate, setIsAddingEstate] = useState(false);
  const [newEstate, setNewEstate] = useState({
    name: '',
    location: '',
    area: ''
  });

  // Resources Data State
  const [resourceData, setResourceData] = useState({
    workers: [],
    equipment: []
  });

  // Initialize worker roles and equipment types as arrays
  const [workerRoles, setWorkerRoles] = useState([
    'Field Supervisor',
    'Tea Plucker',
    'Machine Operator',
    'Quality Inspector',
    'Maintenance Worker',
    'Processing Worker',
    'Field Worker',
    'Transport Worker',
    'Storage Worker'
  ]);
  
  const [equipmentTypes, setEquipmentTypes] = useState([
    'Plucking Machine',
    'Processing Machine',
    'Transport Vehicle',
    'Storage Equipment',
    'Irrigation System',
    'Fertilizer Spreader',
    'Pruning Machine',
    'Quality Testing Equipment',
    'Safety Equipment'
  ]);

  const [newWorker, setNewWorker] = useState({
    role: '',
    count: '',
    status: 'Active',
    estate: ''
  });

  const [newEquipment, setNewEquipment] = useState({
    type: '',
    count: '',
    status: 'Operational',
    estate: ''
  });

  // Add transfer states
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferData, setTransferData] = useState({
    fromEstate: '',
    toEstate: '',
    resourceType: '',
    resourceId: ''
  });

  // Add state for editing
  const [isEditingEstate, setIsEditingEstate] = useState(false);
  const [editingEstate, setEditingEstate] = useState({
    id: '',
    name: '',
    location: '',
    area: ''
  });

  // Add state for editing workers and equipment
  const [isEditingWorker, setIsEditingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState({
    id: '',
    role: '',
    count: '',
    status: ''
  });

  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState({
    id: '',
    type: '',
    count: '',
    status: ''
  });

  // Fetch estates and resource types on component mount
  useEffect(() => {
    fetchEstates();
  }, []);

  // Update resource data when estate is selected
  useEffect(() => {
    if (selectedEstate) {
      const estate = estates.find(e => e._id === selectedEstate);
      if (estate) {
        setResourceData({
          workers: estate.resources?.workers || [],
          equipment: estate.resources?.equipment || []
        });
      }
    }
  }, [selectedEstate, estates]);

  const fetchEstates = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/estate/estates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEstates(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching estates:', error);
      setError('Failed to load estates. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEstate = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/estate`, newEstate, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEstates(prev => [...prev, response.data]);
      setNewEstate({ name: '', location: '', area: '' });
      setIsAddingEstate(false);
      setError(null);
    } catch (error) {
      console.error('Error adding estate:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add estate';
      setError(`Error: ${errorMessage}. Please try again.`);
    }
  };

  // Handle resource transfer
  const handleTransferResource = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/estate/transfer`, transferData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh estates data
      await fetchEstates();
      setIsTransferring(false);
      setTransferData({
        fromEstate: '',
        toEstate: '',
        resourceType: '',
        resourceId: ''
      });
    } catch (error) {
      console.error('Error transferring resource:', error);
      setError('Failed to transfer resource');
    }
  };

  // Update handleAddWorker
  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      
      // Validate input before making request
      if (!newWorker.role || !newWorker.count || !newWorker.status) {
        setError('Please fill in all required fields');
        return;
      }

      const count = Number(newWorker.count);
      if (isNaN(count) || count < 1) {
        setError('Worker count must be a positive number');
        return;
      }
      
      console.log('Adding worker with data:', {
        role: newWorker.role,
        count: count,
        status: newWorker.status,
        estateId: selectedEstate
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/workers`,
        {
          role: newWorker.role,
          count: count,
          status: newWorker.status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Log successful response
      console.log('Worker added successfully:', response.data);

      // Update local state with the new worker
      setResourceData(prev => ({
        ...prev,
        workers: [...prev.workers, response.data]
      }));
      
      // Reset form and error state
      setNewWorker({ role: '', count: '', status: 'Active', estate: '' });
      setIsAddingWorker(false);
      setError(null);
      
      // Refresh estates to get updated metrics
      await fetchEstates();
    } catch (error) {
      console.error('Error adding worker:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.details || error.message;
      setError(`Failed to add worker: ${errorMessage}`);
    }
  };

  // Update handleAddEquipment
  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      
      // Validate input before making request
      if (!newEquipment.type || !newEquipment.count || !newEquipment.status) {
        setError('Please fill in all required fields');
        return;
      }

      const count = Number(newEquipment.count);
      if (isNaN(count) || count < 1) {
        setError('Equipment count must be a positive number');
        return;
      }
      
      console.log('Adding equipment with data:', {
        type: newEquipment.type,
        count: count,
        status: newEquipment.status,
        estateId: selectedEstate
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/equipment`,
        {
          type: newEquipment.type,
          count: count,
          status: newEquipment.status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Log successful response
      console.log('Equipment added successfully:', response.data);

      // Update local state with the new equipment
      setResourceData(prev => ({
        ...prev,
        equipment: [...prev.equipment, response.data]
      }));
      
      // Reset form and error state
      setNewEquipment({ type: '', count: '', status: 'Operational', estate: '' });
      setIsAddingEquipment(false);
      setError(null);
      
      // Refresh estates to get updated metrics
      await fetchEstates();
    } catch (error) {
      console.error('Error adding equipment:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.details || error.message;
      setError(`Failed to add equipment: ${errorMessage}`);
    }
  };

  // Add delete handlers if not already present
  const handleDeleteWorker = async (workerId) => {
    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/workers/${workerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setResourceData(prev => ({
        ...prev,
        workers: prev.workers.filter(worker => worker._id !== workerId)
      }));
      
      // Refresh estates
      fetchEstates();
    } catch (error) {
      console.error('Error deleting worker:', error);
      setError('Failed to delete worker');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/equipment/${equipmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setResourceData(prev => ({
        ...prev,
        equipment: prev.equipment.filter(item => item._id !== equipmentId)
      }));
      
      // Refresh estates
      fetchEstates();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setError('Failed to delete equipment');
    }
  };

  const handleDeleteEstate = async (estateId) => {
    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/estate/${estateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove estate from local state
      setEstates(prev => prev.filter(estate => estate._id !== estateId));
      
      // If the deleted estate was selected, clear the selection
      if (selectedEstate === estateId) {
        setSelectedEstate('');
        setActiveTab('overview');
      }
      
      setError(null);
    } catch (error) {
      console.error('Error deleting estate:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Failed to delete estate: ${errorMessage}`);
    }
  };

  // Add handleEditEstate function
  const handleEditEstate = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estate/${editingEstate.id}`,
        {
          name: editingEstate.name,
          location: editingEstate.location,
          area: editingEstate.area
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update estates list with edited estate
      setEstates(prev => prev.map(estate => 
        estate._id === editingEstate.id ? response.data : estate
      ));

      // Reset edit state
      setIsEditingEstate(false);
      setEditingEstate({ id: '', name: '', location: '', area: '' });
      setError(null);
    } catch (error) {
      console.error('Error updating estate:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Failed to update estate: ${errorMessage}`);
    }
  };

  // Add handleEditWorker function
  const handleEditWorker = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/workers/${editingWorker.id}`,
        {
          role: editingWorker.role,
          count: parseInt(editingWorker.count),
          status: editingWorker.status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setResourceData(prev => ({
        ...prev,
        workers: prev.workers.map(worker => 
          worker._id === editingWorker.id ? response.data : worker
        )
      }));

      // Reset edit state
      setIsEditingWorker(false);
      setEditingWorker({ id: '', role: '', count: '', status: '' });
      setError(null);
      
      // Refresh estates to update metrics
      await fetchEstates();
    } catch (error) {
      console.error('Error updating worker:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Failed to update worker: ${errorMessage}`);
    }
  };

  // Add handleEditEquipment function
  const handleEditEquipment = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estate/${selectedEstate}/equipment/${editingEquipment.id}`,
        {
          type: editingEquipment.type,
          count: parseInt(editingEquipment.count),
          status: editingEquipment.status
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setResourceData(prev => ({
        ...prev,
        equipment: prev.equipment.map(item => 
          item._id === editingEquipment.id ? response.data : item
        )
      }));

      // Reset edit state
      setIsEditingEquipment(false);
      setEditingEquipment({ id: '', type: '', count: '', status: '' });
      setError(null);
      
      // Refresh estates to update metrics
      await fetchEstates();
    } catch (error) {
      console.error('Error updating equipment:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Failed to update equipment: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner"></div>
        <p>Loading estate data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorContainer">
        <p className="errorMessage">{error}</p>
        <button onClick={fetchEstates} className="retryButton">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="manageStatePage">
      <div className="manageStateContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="manageStateHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>Estate Management Dashboard</h1>
        </div>
        
        <div className="tabNavigation">
          <button 
            className={`tabButton ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tabButton ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
        </div>

        <div className="contentArea">
          {activeTab === 'overview' && (
            <div className="overviewSection">
              <div className="sectionHeader">
                <h2>Estate Management</h2>
                <button onClick={() => setIsAddingEstate(true)} className="addButton">
                  <i className="fas fa-plus"></i>
                  Add New Estate
                </button>
              </div>

              {isAddingEstate && (
                <form onSubmit={handleAddEstate} className="addDataForm">
                  <div className="formGrid">
                    <div className="formField">
                      <label>Estate Name</label>
                      <input
                        type="text"
                        placeholder="Estate Name"
                        value={newEstate.name}
                        onChange={(e) => setNewEstate(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="formField">
                      <label>Location</label>
                      <input
                        type="text"
                        placeholder="Location"
                        value={newEstate.location}
                        onChange={(e) => setNewEstate(prev => ({ ...prev, location: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="formField">
                      <label>Total Area (hectares)</label>
                      <input
                        type="number"
                        placeholder="Area"
                        value={newEstate.area}
                        onChange={(e) => setNewEstate(prev => ({ ...prev, area: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="formButtons">
                    <button type="submit">Add Estate</button>
                    <button type="button" onClick={() => {
                      setIsAddingEstate(false);
                      setNewEstate({ name: '', location: '', area: '' });
                    }}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="estatesList">
                <table className="estatesTable">
                  <thead>
                    <tr>
                      <th>Estate Name</th>
                      <th>Location</th>
                      <th>Area (ha)</th>
                      <th>Workers</th>
                      <th>Equipment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estates.map(estate => (
                      <tr key={estate._id}>
                        <td>{estate.name}</td>
                        <td>{estate.location}</td>
                        <td>{estate.area}</td>
                        <td>{estate.metrics?.workerCount || 0}</td>
                        <td>{estate.metrics?.equipmentCount || 0}</td>
                        <td>
                          <div className="actionButtons">
                            <button 
                              className="actionButton"
                              onClick={() => {
                                setSelectedEstate(estate._id);
                                setActiveTab('resources');
                              }}
                            >
                              Manage Resources
                            </button>
                            <button 
                              className="actionButton edit"
                              onClick={() => {
                                setEditingEstate({
                                  id: estate._id,
                                  name: estate.name,
                                  location: estate.location,
                                  area: estate.area
                                });
                                setIsEditingEstate(true);
                              }}
                            >
                              Edit Estate
                            </button>
                            <button 
                              className="actionButton delete"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this estate? This action cannot be undone.')) {
                                  handleDeleteEstate(estate._id);
                                }
                              }}
                            >
                              Delete Estate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'resources' && selectedEstate && (
            <div className="resourcesSection">
              <div className="estateBadge">
                <i className="fas fa-home"></i>
                Selected Estate: {estates.find(e => e._id === selectedEstate)?.name}
              </div>

              <div className="resourceGroup">
                <div className="sectionHeader">
                  <h2>
                    <i className="fas fa-users"></i>
                    Workforce Management
                  </h2>
                  <button onClick={() => setIsAddingWorker(true)} className="addButton">
                    <i className="fas fa-plus"></i>
                    Add Worker Group
                  </button>
                </div>

                {isAddingWorker && (
                  <form onSubmit={handleAddWorker} className="addDataForm">
                    <div className="formGrid">
                      <div className="formField">
                        <label>Role</label>
                        <select
                          value={newWorker.role}
                          onChange={(e) => setNewWorker(prev => ({ ...prev, role: e.target.value }))}
                          required
                        >
                          <option value="">Select Role</option>
                          {workerRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div className="formField">
                        <label>Count</label>
                        <input
                          type="number"
                          placeholder="Count"
                          value={newWorker.count}
                          onChange={(e) => setNewWorker(prev => ({ ...prev, count: e.target.value }))}
                          required
                          min="1"
                        />
                      </div>
                      <div className="formField">
                        <label>Status</label>
                        <select
                          value={newWorker.status}
                          onChange={(e) => setNewWorker(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Training">Training</option>
                        </select>
                      </div>
                    </div>
                    <div className="formButtons">
                      <button type="submit">Add Workers</button>
                      <button type="button" onClick={() => {
                        setIsAddingWorker(false);
                        setNewWorker({ role: '', count: '', status: 'Active', estate: '' });
                      }}>Cancel</button>
                    </div>
                  </form>
                )}

                <table className="resourceTable">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceData.workers.map((worker, index) => (
                      <tr key={`worker-${worker._id || index}`}>
                        <td>
                          <div className="resourceName">
                            <i className="fas fa-user-circle"></i>
                            {worker.role}
                          </div>
                        </td>
                        <td>{worker.count}</td>
                        <td>
                          <span className={`status-badge ${worker.status.toLowerCase().replace(' ', '-')}`}>
                            {worker.status}
                          </span>
                        </td>
                        <td>
                          <div className="actionButtons">
                            <button 
                              className="actionButton edit"
                              onClick={() => {
                                setEditingWorker({
                                  id: worker._id,
                                  role: worker.role,
                                  count: worker.count,
                                  status: worker.status
                                });
                                setIsEditingWorker(true);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="actionButton delete"
                              onClick={() => handleDeleteWorker(worker._id)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="resourceGroup">
                <div className="sectionHeader">
                  <h2>
                    <i className="fas fa-tools"></i>
                    Equipment Inventory
                  </h2>
                  <button onClick={() => setIsAddingEquipment(true)} className="addButton">
                    <i className="fas fa-plus"></i>
                    Add Equipment
                  </button>
                </div>

                {isAddingEquipment && (
                  <form onSubmit={handleAddEquipment} className="addDataForm">
                    <div className="formGrid">
                      <div className="formField">
                        <label>Equipment Type</label>
                        <select
                          value={newEquipment.type}
                          onChange={(e) => setNewEquipment(prev => ({ ...prev, type: e.target.value }))}
                          required
                        >
                          <option value="">Select Type</option>
                          {equipmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="formField">
                        <label>Count</label>
                        <input
                          type="number"
                          placeholder="Count"
                          value={newEquipment.count}
                          onChange={(e) => setNewEquipment(prev => ({ ...prev, count: e.target.value }))}
                          required
                          min="1"
                        />
                      </div>
                      <div className="formField">
                        <label>Status</label>
                        <select
                          value={newEquipment.status}
                          onChange={(e) => setNewEquipment(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <option value="Operational">Operational</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Out of Service">Out of Service</option>
                        </select>
                      </div>
                    </div>
                    <div className="formButtons">
                      <button type="submit">Add Equipment</button>
                      <button type="button" onClick={() => {
                        setIsAddingEquipment(false);
                        setNewEquipment({ type: '', count: '', status: 'Operational', estate: '' });
                      }}>Cancel</button>
                    </div>
                  </form>
                )}

                <table className="resourceTable">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceData.equipment.map((item, index) => (
                      <tr key={`equipment-${item._id || index}`}>
                        <td>
                          <div className="resourceName">
                            <i className="fas fa-tools"></i>
                            {item.type}
                          </div>
                        </td>
                        <td>{item.count}</td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="actionButtons">
                            <button 
                              className="actionButton edit"
                              onClick={() => {
                                setEditingEquipment({
                                  id: item._id,
                                  type: item.type,
                                  count: item.count,
                                  status: item.status
                                });
                                setIsEditingEquipment(true);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="actionButton delete"
                              onClick={() => handleDeleteEquipment(item._id)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditingEstate && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Edit Estate</h3>
            <form onSubmit={handleEditEstate} className="addDataForm">
              <div className="formGrid">
                <div className="formField">
                  <label>Estate Name</label>
                  <input
                    type="text"
                    value={editingEstate.name}
                    onChange={(e) => setEditingEstate(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="formField">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editingEstate.location}
                    onChange={(e) => setEditingEstate(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div className="formField">
                  <label>Total Area (hectares)</label>
                  <input
                    type="number"
                    value={editingEstate.area}
                    onChange={(e) => setEditingEstate(prev => ({ ...prev, area: e.target.value }))}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="formButtons">
                <button type="submit">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingEstate(false);
                    setEditingEstate({ id: '', name: '', location: '', area: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingWorker && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Edit Worker Group</h3>
            <form onSubmit={handleEditWorker} className="addDataForm">
              <div className="formGrid">
                <div className="formField">
                  <label>Role</label>
                  <select
                    value={editingWorker.role}
                    onChange={(e) => setEditingWorker(prev => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    <option value="">Select Role</option>
                    {workerRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="formField">
                  <label>Count</label>
                  <input
                    type="number"
                    value={editingWorker.count}
                    onChange={(e) => setEditingWorker(prev => ({ ...prev, count: e.target.value }))}
                    required
                    min="1"
                  />
                </div>
                <div className="formField">
                  <label>Status</label>
                  <select
                    value={editingWorker.status}
                    onChange={(e) => setEditingWorker(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
              </div>
              <div className="formButtons">
                <button type="submit">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingWorker(false);
                    setEditingWorker({ id: '', role: '', count: '', status: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingEquipment && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Edit Equipment</h3>
            <form onSubmit={handleEditEquipment} className="addDataForm">
              <div className="formGrid">
                <div className="formField">
                  <label>Equipment Type</label>
                  <select
                    value={editingEquipment.type}
                    onChange={(e) => setEditingEquipment(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="">Select Type</option>
                    {equipmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="formField">
                  <label>Count</label>
                  <input
                    type="number"
                    value={editingEquipment.count}
                    onChange={(e) => setEditingEquipment(prev => ({ ...prev, count: e.target.value }))}
                    required
                    min="1"
                  />
                </div>
                <div className="formField">
                  <label>Status</label>
                  <select
                    value={editingEquipment.status}
                    onChange={(e) => setEditingEquipment(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
              </div>
              <div className="formButtons">
                <button type="submit">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingEquipment(false);
                    setEditingEquipment({ id: '', type: '', count: '', status: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStatePage;