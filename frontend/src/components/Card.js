import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { updateCard, deleteCard } from '../store/slices/cardSlice';
import { format } from 'date-fns';

const priorityColors = {
  low: '#4CAF50',
  medium: '#FFC107',
  high: '#F44336',
};

const Card = ({ card }) => {
  const dispatch = useDispatch();
  const { error, loading } = useSelector((state) => state.cards || {});
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedCard, setEditedCard] = useState({
    title: card.title,
    description: card.description,
    deadline: card.deadline || '',
    priority: card.priority || 'low',
  });

  const handleDeleteCard = async () => {
    try {
      await dispatch(deleteCard(card._id)).unwrap();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete card:', error);
      // The error will be handled by the Redux store
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditedCard({
      title: card.title,
      description: card.description,
      deadline: card.deadline || '',
      priority: card.priority || 'low',
    });
  };

  const handleChange = (e) => {
    setEditedCard({
      ...editedCard,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateCard({
        cardId: card._id,
        cardData: editedCard
      })).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to update card:', error);
      // The error will be handled by the Redux store
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: 2,
          mb: 1,
          bgcolor: 'white',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'grey.50',
          },
        }}
        onClick={handleOpen}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" component="h4">
            {card.title}
          </Typography>
          <Box>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              disabled={loading}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="error" 
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              title="Delete Card"
              disabled={loading}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {card.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {card.description}
          </Typography>
        )}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          {card.deadline && (
            <Typography
              variant="caption"
              sx={{
                color: new Date(card.deadline) < new Date() ? 'error.main' : 'text.secondary',
                bgcolor: 'grey.100',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              Due: {format(new Date(card.deadline), 'MMM d, yyyy')}
            </Typography>
          )}
          {card.priority && (
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                bgcolor: priorityColors[card.priority],
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Card</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Card Title"
              type="text"
              fullWidth
              required
              value={editedCard.title}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={editedCard.description}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="dense"
              name="deadline"
              label="Deadline"
              type="datetime-local"
              fullWidth
              value={editedCard.deadline}
              onChange={handleChange}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={editedCard.priority}
                onChange={handleChange}
                label="Priority"
                disabled={loading}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Card</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this card? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteCard} color="error" variant="contained" disabled={loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Card; 