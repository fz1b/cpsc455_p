import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import { FaRegTrashAlt } from 'react-icons/fa';
import styled from 'styled-components';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import { BootstrapInput } from './CustomizedComponents';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { BsFillChatSquareDotsFill } from 'react-icons/bs';
import { IconContext } from 'react-icons';
import { createJournal, editJournal } from '../services/JournalServices';
import { useDropzone } from 'react-dropzone';
import AuthContext from '../authAPI/auth-context';
import S3 from 'aws-s3';
import sha256 from 'crypto-js/sha256';

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant='h6'>{children}</Typography>
            {onClose ? (
                <IconButton
                    aria-label='close'
                    className={classes.closeButton}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const TitleInput = withStyles((theme) => ({
    root: {
        width: '90%',
    },
}))(TextField);

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);

const Date = styled.span`
    position: absolute;
    right: 78%;
`;

const Dropzone = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border-width: 2px;
    border-radius: 2px;
    border-color: #eeeeee;
    border-style: dashed;
    background-color: #fafafa;
    color: #bdbdbd;
    outline: none;
    transition: border 0.24s ease-in-out;
`;

export default function CustomizedDialogs({
    journal,
    handleClose,
    authorMode,
    updateJournals,
    handleEdit,
}) {
    const [privacy, setPrivacy] = useState(journal.privacy);
    const [content, setContent] = useState(journal.content);
    const [title, setTitle] = useState(journal.title);
    const [coverImg, setCoverImg] = useState(journal.image);
    const [liked, setLiked] = useState(false);
    const auth = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [uploaded, setLoaded] = useState(false);
    
    const config = {
        bucketName: 'treehole',
        region: process.env.REACT_APP_REGION,
        accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
    };
    const S3Client = new S3(config);

    const handlePrivacyChange = (event) => {
        setPrivacy(event.target.value);
    };
    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };
    const handleContentChange = (e) => {
        setContent(e.target.value);
    };

    const handleLike = () => {
        setLiked((state) => !state);
    };

    const handleSave = (title, date, image, weather, content, privacy) => {
        if (!journal._id) {
            // create a new journal
            createJournal(
                auth.token,
                title,
                date,
                image,
                weather,
                content,
                privacy
            )
                .then((res) => {
                    updateJournals();
                })
                .catch((err) => {
                    console.log(err);
                });
            handleClose();
        } else {
            // edit an existing journal
            editJournal(
                journal.author_id,
                journal._id,
                title,
                date,
                image,
                weather,
                content,
                privacy
            )
                .then((res) => {
                    updateJournals();
                })
                .catch((err) => {
                    console.log(err);
                });
            handleEdit(false);
        }
    };


    const uploadFiles = () => {
        S3Client.uploadFile(files[0], sha256(files[0].name))
            .then((data) => {
                console.log(data.location);
                setLoaded(true);
                setCoverImg(data.location);
            })
            .catch((err) => console.error(err));
    };

    const thumbsContainer = {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        justifyContent: 'center',
    };

    const thumb = {
        display: 'inline-flex',
        borderRadius: 2,
        maxHeight: 500,
        padding: 0,
        marginBottom: 20,
        boxSizing: 'border-box',
    };

    const thumbInner = {
        minWidth: 0,
    };

    const img = {
        maxWidth: '100%',
        maxHeight: 500,
        borderRadius: 5,
        border: '5px solid #eaeaea',
        boxSizing: 'border-box',
    };

    const buttonStyle = {
        margin: 10,
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: 'image/*',
        onDrop: (acceptedFiles) => {
            setFiles(
                acceptedFiles.map((file) =>
                    Object.assign(file, {
                        preview: URL.createObjectURL(file),
                    })
                )
            );
        },
    });

    const thumbs = files.map((file) => (
        <div style={thumb} key={file.name}>
            <div style={thumbInner}>
                <img src={file.preview} style={img} alt={file.size} />
            </div>
        </div>
    ));

    useEffect(
        () => () => {
            // Make sure to revoke the data uris to avoid memory leaks
            files.forEach((file) => URL.revokeObjectURL(file.preview));
        },
        [files]
    );

    return (
        <div>
            <Dialog
                onClose={handleClose}
                aria-labelledby='customized-dialog-title'
                open={true}
                fullWidth={true}
                maxWidth='sm'
            >
                <DialogTitle id='customized-dialog-title' onClose={handleClose}>
                    <TitleInput
                        id='outlined-basic'
                        label='Title'
                        variant='outlined'
                        size='small'
                        value={title}
                        onChange={handleTitleChange}
                    />
                </DialogTitle>
                <DialogContent dividers>
                    <section className='container'>
                        {files.length === 0 && (
                            <Dropzone
                                {...getRootProps({ className: 'dropzone' })}
                            >
                                <input {...getInputProps()} />
                                <p>Drag the cover image, or click to upload</p>
                            </Dropzone>
                        )}
                        <aside style={thumbsContainer}>{thumbs}</aside>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}
                        >
                            {files.length !== 0 && (
                                <div>
                                    <Button
                                        onClick={() => setFiles([])}
                                        style={buttonStyle}
                                        variant='contained'
                                        color='secondary'
                                        disabled={uploaded}
                                    >
                                        Remove Upload
                                    </Button>
                                    <Button
                                        onClick={() => uploadFiles()}
                                        style={buttonStyle}
                                        variant='contained'
                                        color='primary'
                                        disabled={uploaded}
                                    >
                                        Upload Picture
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    <Typography component={'span'} gutterBottom>
                        <TextField
                            fullWidth
                            label='Content'
                            id='outlined-basic'
                            variant='outlined'
                            multiline
                            rows='10'
                            value={content}
                            onChange={handleContentChange}
                        />
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Date>{journal.date}</Date>
                    {authorMode && (
                        <>
                            <Select
                                labelId='demo-customized-select-label'
                                id='demo-customized-select'
                                value={privacy}
                                onChange={handlePrivacyChange}
                                input={<BootstrapInput />}
                            >
                                <MenuItem value='PUBLIC'>PUBLIC</MenuItem>
                                <MenuItem value='ANONYMOUS'>ANONYMOUS</MenuItem>
                                <MenuItem value='PRIVATE'>PRIVATE</MenuItem>
                            </Select>
                        </>
                    )}
                    <>
                        <span onClick={handleLike}>
                            {!liked && (
                                <IconButton>
                                    <FaRegHeart />
                                </IconButton>
                            )}
                            {liked && (
                                <IconContext.Provider
                                    value={{ color: '#b95050' }}
                                >
                                    <IconButton>
                                        <FaHeart />
                                    </IconButton>
                                </IconContext.Provider>
                            )}
                        </span>
                        <IconButton>
                            <BsFillChatSquareDotsFill />
                        </IconButton>
                        {authorMode && (
                            <>
                                <span>
                                    <IconButton>
                                        <FaRegTrashAlt />
                                    </IconButton>
                                </span>
                                <Button
                                    variant='contained'
                                    color='primary'
                                    onClick={() =>
                                        handleSave(
                                            title,
                                            journal.date,
                                            coverImg,
                                            journal.weather,
                                            content,
                                            privacy
                                        )
                                    }
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </>
                </DialogActions>
            </Dialog>
        </div>
    );
}
