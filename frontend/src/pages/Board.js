import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { fetchBoard, deleteBoard } from '../store/slices/boardSlice';
import { fetchLists, createList, reorderLists } from '../store/slices/listSlice';
import { fetchCards, createCard, reorderCards } from '../store/slices/cardSlice';
import List from '../components/List';

const Board = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { boardId } = useParams();
  const { currentBoard, loading: boardLoading, error: boardError } = useSelector((state) => state.board);
  const { lists, loading: listsLoading, error: listsError } = useSelector((state) => state.list);
  const { cards = [], loading: cardsLoading, error: cardsError } = useSelector((state) => state.cards || {});
  const [open, setOpen] = useState(false);
  const [newList, setNewList] = useState({ title: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const loadedListsRef = useRef(new Set());

  // Fetch board and lists only once when component mounts or boardId changes
  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoard(boardId));
      dispatch(fetchLists(boardId));
    }
  }, [dispatch, boardId]);

  // Fetch cards for each list only when lists change
  useEffect(() => {
    if (lists && lists.length > 0) {
      lists.forEach(list => {
        if (!loadedListsRef.current.has(list._id)) {
          dispatch(fetchCards(list._id));
          loadedListsRef.current.add(list._id);
        }
      });
    }
  }, [dispatch, lists]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewList({ title: '' });
  };

  const handleChange = (e) => {
    setNewList({
      ...newList,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createList({
        title: newList.title,
        board_id: boardId
      })).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleDeleteBoard = async () => {
    try {
      await dispatch(deleteBoard(boardId)).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
    setDeleteDialogOpen(false);
  };

  const onDragEnd = (result) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'list') {
      const reorderedLists = Array.from(lists);
      const [removed] = reorderedLists.splice(source.index, 1);
      reorderedLists.splice(destination.index, 0, removed);
      dispatch(reorderLists(reorderedLists));
    } else if (type === 'card') {
      const sourceList = lists.find(list => list._id === source.droppableId);
      const destinationList = lists.find(list => list._id === destination.droppableId);
      const sourceCards = cards.filter(card => card.list_id === source.droppableId);
      const destinationCards = cards.filter(card => card.list_id === destination.droppableId);

      if (sourceList && destinationList) {
        dispatch(reorderCards({
          sourceListId: source.droppableId,
          destinationListId: destination.droppableId,
          sourceCards,
          destinationCards
        }));
      }
    }
  };

  if (boardLoading || listsLoading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (boardError || listsError) {
    return (
      <Container>
        <Typography color="error">
          {boardError || listsError}
        </Typography>
      </Container>
    );
  }

  if (!currentBoard) {
    return (
      <Container>
        <Typography>Board not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
          {currentBoard.title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          disabled={listsLoading}
        >
          Add List
        </Button>
        <IconButton 
          color="error" 
          onClick={() => setDeleteDialogOpen(true)}
          title="Delete Board"
        >
          <DeleteIcon />
        </IconButton>
      </Stack>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                display: 'flex',
                gap: 1,
                minHeight: 500,
                overflowX: 'auto',
                pb: 1,
              }}
            >
              {lists && lists.map((list, index) => (
                <Draggable
                  key={list._id}
                  draggableId={list._id}
                  index={index}
                >
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <List
                        list={list}
                        cards={cards.filter(card => card.list_id === list._id)}
                      />
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New List</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="List Title"
              type="text"
              fullWidth
              required
              value={newList.title}
              onChange={handleChange}
              disabled={listsLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={listsLoading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={listsLoading}>
              {listsLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Board</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this board? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteBoard} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Board; 