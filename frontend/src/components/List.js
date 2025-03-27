import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { createCard } from '../store/slices/cardSlice';
import { deleteList } from '../store/slices/listSlice';
import Card from './Card';

const List = ({ list, cards }) => {
  const dispatch = useDispatch();
  const { error: cardError, loading: cardLoading } = useSelector((state) => state.cards || {});
  const { error: listError, loading: listLoading } = useSelector((state) => state.list || {});
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'low',
  });

  const handleDeleteList = async () => {
    try {
      await dispatch(deleteList(list._id)).unwrap();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete list:', error);
      // The error will be handled by the Redux store
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewCard({
      title: '',
      description: '',
      deadline: '',
      priority: 'low',
    });
  };

  const handleChange = (e) => {
    setNewCard({
      ...newCard,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createCard({
        title: newCard.title,
        description: newCard.description,
        deadline: newCard.deadline,
        priority: newCard.priority,
        list_id: list._id
      })).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to create card:', error);
      // The error will be handled by the Redux store
    }
  };

  return (
    <Paper
      sx={{
        width: 280,
        bgcolor: 'grey.50',
        p: 1,
      }}
    >
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h3">
          {list.title}
        </Typography>
        <Box>
          <IconButton size="small" onClick={handleOpen} disabled={cardLoading}>
            <AddIcon />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete List"
            disabled={listLoading}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {(cardError || listError) && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {cardError || listError}
        </Alert>
      )}

      <Droppable droppableId={list._id} type="card">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 100,
              py: 1,
            }}
          >
            {cards.map((card, index) => (
              <Draggable
                key={card._id}
                draggableId={card._id}
                index={index}
              >
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Card card={card} />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Card</DialogTitle>
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
              value={newCard.title}
              onChange={handleChange}
              disabled={cardLoading}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={newCard.description}
              onChange={handleChange}
              disabled={cardLoading}
            />
            <TextField
              margin="dense"
              name="deadline"
              label="Deadline"
              type="datetime-local"
              fullWidth
              value={newCard.deadline}
              onChange={handleChange}
              disabled={cardLoading}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={newCard.priority}
                onChange={handleChange}
                label="Priority"
                disabled={cardLoading}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={cardLoading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={cardLoading}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete List</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this list? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={listLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteList} color="error" variant="contained" disabled={listLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default List; 