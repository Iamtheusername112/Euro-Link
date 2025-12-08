# Admin & Driver Panel Features

## Overview
The admin/driver panel provides complete control over the courier system, allowing admins and drivers to manage shipments, assign drivers, update statuses, and communicate with users through notifications.

## Key Features

### 1. **Real-Time Dashboard**
- **Admin View**: 
  - Total shipments count
  - Total revenue
  - Total customers
  - Active drivers count
  - Status overview (Pending, In Transit, Delivered)
  
- **Driver View**:
  - Total assignments
  - Pending assignments
  - In Transit assignments
  - Delivered count

### 2. **Shipment Management**

#### Status Updates
Admins and drivers can update shipment statuses:
- **Pending/Paid** → **In Transit**: Shipment starts its journey
- **In Transit** → **Out for Delivery**: Package is out for delivery
- **In Transit/Out for Delivery** → **Delivered**: Package delivered successfully

**Automatic Notifications**: Every status update automatically sends a notification to the customer.

#### Driver Assignment (Admin Only)
- View all unassigned shipments
- Assign drivers to shipments
- View driver assignments
- Customers are automatically notified when a driver is assigned

### 3. **User Management (Admin Only)**

#### User List
- View all users (Customers, Drivers, Admins)
- See user details (name, phone, role)
- View shipment count per user
- Access user-specific shipment history

#### Direct Communication
- Send custom notifications to any customer
- Notifications appear in user's notification center
- Real-time notification delivery

### 4. **Notification System**

#### Automatic Notifications
Notifications are automatically sent when:
- Shipment status changes
- Driver is assigned to a shipment
- Admin sends a custom message

#### Notification Types
- `status_update`: Shipment status changed
- `assignment`: Driver assigned
- `admin_message`: Custom admin message

#### User Experience
- Notification bell with unread count badge
- Notification dropdown on header
- Full notifications page (`/notifications`)
- Mark as read / Mark all as read
- Click notification to view shipment details

### 5. **Real Database Integration**

All features use real database operations:
- **Shipments**: Full CRUD operations
- **Notifications**: Create, read, update
- **Profiles**: User management
- **Status History**: Complete audit trail

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  shipment_id UUID REFERENCES shipments(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Shipments Table (Enhanced)
- `driver_id`: UUID reference to assigned driver
- `status`: Current shipment status
- `updated_at`: Last update timestamp

## API Endpoints

### Notifications
- `GET /api/notifications?userId={id}` - Get user notifications
- `GET /api/notifications?userId={id}&unreadOnly=true` - Get unread only
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications?id={id}` - Update notification (mark as read)
- `POST /api/notifications/mark-all-read?userId={id}` - Mark all as read

### Shipments
- `GET /api/shipments` - Get shipments (with filters)
- `POST /api/shipments` - Create shipment
- `PATCH /api/shipments?id={id}` - Update shipment

## User Flows

### Admin Flow
1. Login at `/admin/login`
2. View dashboard with all statistics
3. Assign drivers to pending shipments
4. Update shipment statuses (triggers notifications)
5. Manage users and send notifications
6. View all shipments and their statuses

### Driver Flow
1. Login at `/admin/login` (with driver credentials)
2. View assigned shipments only
3. Update status of assigned shipments
4. Mark deliveries as complete

### Customer Flow
1. Create shipment
2. Receive automatic notifications on status changes
3. View notifications in notification center
4. Track shipments in real-time

## Security

- **Row Level Security (RLS)**: All tables have RLS policies
- **Role-Based Access**: Admin/Driver/Customer roles enforced
- **User Isolation**: Users can only see their own data
- **Admin Override**: Admins can view all data

## Real-Time Updates

- Notifications poll every 30 seconds
- Dashboard refreshes after status updates
- Notification count updates automatically
- Status changes reflect immediately

## Setup Instructions

1. **Run Database Setup**:
   ```sql
   -- Run docs/SETUP_DATABASE.sql in Supabase SQL Editor
   ```

2. **Create Admin Account**:
   - Login at `/admin/login` with credentials
   - Admin account auto-creates on first login

3. **Create Driver Accounts**:
   - Admin can create driver profiles via SQL or Supabase Dashboard
   - Drivers login at `/admin/login`

4. **Start Managing**:
   - Assign drivers to shipments
   - Update statuses
   - Send notifications
   - Monitor all activity

## Best Practices

1. **Status Updates**: Always update status through the dashboard (triggers notifications)
2. **Driver Assignment**: Assign drivers before marking "In Transit"
3. **Notifications**: Use custom notifications for important updates
4. **User Management**: Regularly review user list and shipment counts
5. **Status History**: All status changes are logged automatically

## Troubleshooting

### Notifications Not Sending
- Check if `notifications` table exists
- Verify RLS policies allow admin inserts
- Check browser console for errors

### Driver Assignments Not Showing
- Verify `driver_id` column exists in `shipments` table
- Check driver profile has `role = 'Driver'`
- Ensure driver is logged in

### Status Updates Failing
- Verify `shipment_status_history` table exists
- Check RLS policies
- Ensure user has Admin/Driver role

